import { pdfManager } from './pdf-manager'
import { ocrManager } from './ocr-manager'
import { ocrLangs } from './ocr-langs'

/**
 * Returns the text of a PDF file. There is a 120s timeout for the extraction.
 * If the extraction fails, an empty string is returned.
 */
const getPdfText = pdfManager.getPdfText.bind(pdfManager)

/**
 * Returns the text of an image file. You can also specify the languages to use for OCR.
 */
const getImageText = ocrManager.getImageText.bind(ocrManager)

/**
 * Returns the list of supported languages for OCR
 */
function getOcrLangs() {
  return ocrLangs
}

export { getPdfText, getImageText, getOcrLangs }
