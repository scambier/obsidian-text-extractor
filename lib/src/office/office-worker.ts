import mammoth from "mammoth";
import { utils as sheetUtils, read as xlsxRead } from 'xlsx'

onmessage = async evt => {
  try {
    let text = ''
    if (evt.data.extension === 'docx') {
      text = await extractWordText(evt.data.data)
    } else if (evt.data.extension === 'xlsx') {
      text = await extractExcelText(evt.data.data)
    }
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

async function extractExcelText(arr: Uint8Array): Promise<string> {
  const workbook = xlsxRead(arr, { type: 'buffer' })
  let text = ''
  const sheets = workbook.SheetNames
  for (const sheet of sheets) {
    text += `${sheet} `
    text += sheetUtils.sheet_to_txt(workbook.Sheets[sheet])
  }
  return text
}
