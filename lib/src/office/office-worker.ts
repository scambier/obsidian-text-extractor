import mammoth from "mammoth";

onmessage = async evt => {
  try {
    let text = await extractWordText(evt.data.data)
    self.postMessage({ text })
  } catch (e) {
    console.info('Text Extractor - Could not extract text from ' + evt.data.name)
    self.postMessage({ text: '' })
  }
}

async function extractWordText(arr: Uint8Array): Promise<string> {
  const result = await mammoth.extractRawText({ arrayBuffer: arr })
  return result.value
}
