import { pdfManager } from './pdf-manager'
import { ocrManager } from './ocr-manager'
import { ocrLangs } from './ocr-langs'
import type { TFile } from 'obsidian'

const extractText = function (file: TFile): Promise<string> {
  if (isFilePDF(file.path)) {
    return pdfManager.getPdfText(file)
  } else if (isFileImage(file.path)) {
    return ocrManager.getImageText(file)
  }
  return Promise.resolve('')
}

function isFilePDF(path: string): boolean {
  return path.endsWith('.pdf')
}

function isFileImage(path: string): boolean {
  return (
    path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.jpeg')
  )
}

/**
 * Returns the list of supported languages for OCR
 */
function getOcrLangs() {
  return ocrLangs
}

export { extractText, getOcrLangs, isFilePDF, isFileImage }
