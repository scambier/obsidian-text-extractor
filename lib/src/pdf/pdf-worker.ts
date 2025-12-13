import rustPlugin from '../../pkg/obsidian_text_extract_bg.wasm'
import * as plugin from '../../pkg'

const decodedPlugin = decodeBase64(rustPlugin as any)

function normalize(text: string) {
  if (text === null || text === undefined) return ''
  else return text.replace(/[ \n]+/g, ' ').trim()
}

/**
 * Extract text from the PDF by calling into WASM plugin
 * @param pdf pdf buffer
 * @param shouldNormalize true to normalize all spaces/newlines to a single space
 */
function extract(pdf: Uint8Array, shouldNormalize: boolean) {
  // Extract text by page
  let text = plugin.extract_pdf_text_by_pages(pdf)

  // If requested, normalize text
  if (shouldNormalize) {
    text = text.map(normalize)
  }

  // Turn into a markdown doc
  return text
    .map((text, i) => `# Page ${i + 1}^page=${i + 1}\n${text}\n\n`)
    .join('')
}

onmessage = async evt => {
  const buffer = Uint8Array.from(decodedPlugin, c => c.charCodeAt(0))
  await plugin.default(Promise.resolve(buffer))

  try {
    const pdf = evt.data.data as Uint8Array
    const shouldNormalize: boolean = !!evt.data.normalize

    // Perform text extraction
    const text = extract(pdf, shouldNormalize)

    self.postMessage({ text })
  } catch (e) {
    console.info('Text Extractor - Could not extract text from ' + evt.data.name)
    self.postMessage({ text: '' })
  }
}

function decodeBase64(data: string) {
  return atob(data)
  // return Buffer.from(data, 'base64').toString()
}
