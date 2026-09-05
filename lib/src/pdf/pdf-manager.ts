import { Platform, TFile } from 'obsidian'
import {
  CANT_EXTRACT_ON_MOBILE,
  FAILED_TO_EXTRACT,
  pdfProcessQueue,
  workerTimeout,
} from '../globals'
import { getCachePath, readCache, writeCache } from '../cache'

function extractWithPdftotext(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const { spawn }: typeof import('child_process') = require('child_process')
    const child = spawn('pdftotext', ['-layout', filePath, '-'])
    const stdout: Buffer[] = []
    const stderr: Buffer[] = []
    let finished = false

    const timer = setTimeout(() => {
      if (finished) return
      finished = true
      child.kill('SIGKILL')
      reject(new Error(`pdftotext timed out after ${workerTimeout} ms`))
    }, workerTimeout)

    child.stdout.on('data', (data: Buffer) => stdout.push(data))
    child.stderr.on('data', (data: Buffer) => stderr.push(data))

    child.on('error', (error: Error) => {
      if (finished) return
      finished = true
      clearTimeout(timer)
      reject(error)
    })

    child.on('close', (code: number | null) => {
      if (finished) return
      finished = true
      clearTimeout(timer)

      if (code !== 0) {
        const error = Buffer.concat(stderr).toString('utf8').trim()
        reject(
          new Error(
            `pdftotext exited with code ${code}${error ? `: ${error}` : ''}`
          )
        )
        return
      }

      resolve(Buffer.concat(stdout).toString('utf8'))
    })
  })
}

function normalize(text: string): string {
  return text.replace(/[ \n]+/g, ' ').trim()
}

function formatPdfText(text: string): string {
  const pages = text.split('\f')

  if (pages.length > 0 && pages[pages.length - 1].trim() === '') {
    pages.pop()
  }

  return pages
    .map((page, i) => `# Page ${i + 1}^page=${i + 1}\n${normalize(page)}\n\n`)
    .join('')
}

class PDFManager {
  public async getPdfText(file: TFile): Promise<string> {
    try {
      return await pdfProcessQueue.add(() => this.#getPdfText(file)) ?? ''
    } catch (e) {
      console.warn(
        `Text Extractor - Error while extracting text from ${file.basename}`
      )
      console.warn(e)
      return ''
    }
  }

  async #getPdfText(file: TFile): Promise<string> {
    const cache = await readCache(file)

    if (cache) {
      return cache.text ?? FAILED_TO_EXTRACT
    }

    if (Platform.isMobileApp) {
      return CANT_EXTRACT_ON_MOBILE
    }

    const cachePath = getCachePath(file)

    try {
      const fullPath = (app.vault.adapter as any).getFullPath(file.path)
const text = await extractWithPdftotext(fullPath)
      const formattedText = formatPdfText(text)

      await writeCache(
        cachePath.folder,
        cachePath.filename,
        formattedText,
        file.path,
        ''
      )

      return formattedText
    } catch (e) {
      console.warn(
        `Text Extractor - Could not extract text from ${file.basename} using pdftotext`
      )
      console.warn(e)

      await writeCache(
        cachePath.folder,
        cachePath.filename,
        '',
        file.path,
        ''
      )

      return ''
    }
  }
}

export const pdfManager = new PDFManager()