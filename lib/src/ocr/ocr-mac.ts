import { FileSystemAdapter, Platform, TFile } from 'obsidian'

function runOsascript(
  script: string,
  args: string[]
): Promise<{
  stdout: string
  stderr: string
}> {
  return new Promise((resolve, reject) => {
    const { spawn }: typeof import('child_process') = require('child_process')
    const child = spawn('osascript', args)
    let stdout = ''
    let stderr = ''

    child.stdout.on('data', data => {
      stdout += data.toString()
    })

    child.stderr.on('data', data => {
      stderr += data.toString()
    })

    child.on('close', code => {
      if (code === 0) {
        resolve({ stdout, stderr })
      } else {
        reject(new Error(`Process exited with code ${code}: ${stderr}`))
      }
    })

    child.on('error', err => {
      reject(err)
    })

    child.stdin.write(script)
    child.stdin.end()
  })
}

const scptSourceCode = `
-- copyright https://stackoverflow.com/a/75779406
use framework "Vision"

on getImageText(imagePath)
    -- Get image content
    set theImage to current application's NSImage's alloc()'s initWithContentsOfFile:imagePath

     -- Set up request handler using image's raw data
    set requestHandler to current application's VNImageRequestHandler's alloc()'s initWithData:(theImage's TIFFRepresentation()) options:(current application's NSDictionary's alloc()'s init())

    -- Initialize text request
    set theRequest to current application's VNRecognizeTextRequest's alloc()'s init()
    theRequest's setAutomaticallyDetectsLanguage:true

     -- Perform the request and get the results
    requestHandler's performRequests:(current application's NSArray's arrayWithObject:(theRequest)) |error|:(missing value)
    set theResults to theRequest's results()

    -- Obtain and return the string values of the results
    set theText to {}
    repeat with observation in theResults
        copy ((first item in (observation's topCandidates:1))'s |string|() as text) to end of theText
    end repeat
    return theText
end getImageText

on run (argv)
    if (count of argv) is 0 then error "Must provide an image path"
    set text item delimiters to linefeed
    getImageText(item 1 of argv) as text
end run
`

/**
 * @param {TFile} image - image
 * @returns {Promise<string>} - the result text
 */
export async function extractTextByMacOCR(image: TFile): Promise<string> {
  if (!(Platform.isDesktopApp && Platform.isMacOS)) {
    throw new Error('SystemOCR is currently only supported on macOS')
  }
  const adapter = image.vault.adapter
  let imagePath: string
  if (adapter instanceof FileSystemAdapter) {
    imagePath = adapter.getFullPath(image.path)
  } else {
    throw new Error('Can not get FileSystemAdapter')
  }
  const { stdout, stderr } = await runOsascript(scptSourceCode, [
    '-',
    imagePath,
  ])
  if (stderr) {
    console.error('Text Extractor - error occurred while invoking mac OCR ')
    console.error(stderr)
  }
  return stdout
}
