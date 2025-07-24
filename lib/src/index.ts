import { pdfManager } from './pdf/pdf-manager'
import { officeManager } from './office/office-manager'
import { clearOCRWorkers, ocrManager } from './ocr/ocr-manager'
import { ocrLangs } from './ocr/ocr-langs'
import type { TFile } from 'obsidian'
import type { OcrOptions } from './types'
import { pdfProcessQueue } from './globals'
import { convertOldCachePaths, getCacheBasePath, getCachePath } from './cache'

/**
 * Returns a promise that resolves to the text extracted from the file.
 * On mobile, if the text is not already extracted and cached, will return an empty string.
 * Will throw an error if the file type is not supported; check canFileBeExtracted() first.
 * @param file
 * @param options - An array of languages to try. If not provided, the default is English
 * @returns
 */
function extractText(
  file: TFile,
  options: Partial<OcrOptions>
): Promise<string> {
  const opts = Object.assign(
    {},
    { langs: ['eng'], useSystemOCR: false },
    options
  )

  if (isFilePDF(file.path)) {
    return pdfManager.getPdfText(file)
  } else if (isFileImage(file.path)) {
    return ocrManager.getImageText(file, opts)
  } else if (isFileOffice(file.path)) {
    return officeManager.getOfficeText(file)
  }
  throw new Error('File type not supported')
}

function isFilePDF(path: string): boolean {
  return path.toLowerCase().endsWith('.pdf')
}

function isFileImage(path: string): boolean {
  path = path.toLowerCase()
  return (
    path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.jpeg') ||
    path.endsWith('.webp') || path.endsWith('.gif') || path.endsWith('.bmp')
  )
}

function isFileOffice(path: string): boolean {
  path = path.toLowerCase()
  return (
    path.endsWith('.docx') || path.endsWith('.xlsx')
  )
}

/**
 * Returns true if the filepath is a supported file type.
 * @param filePath
 * @returns
 */
function canFileBeExtracted(filePath: string): boolean {
  return isFilePDF(filePath) || isFileImage(filePath) || isFileOffice(filePath)
}

/**
 * Returns the list of supported languages for OCR
 */
function getOcrLangs(): typeof ocrLangs {
  return ocrLangs
}

/**
 * Clears the process queue.
 * This stops any pending text extraction.
 */
function clearProcessQueue() {
  pdfProcessQueue.clear()
}

async function isInCache(file: TFile): Promise<boolean> {
  const path = getCachePath(file)
  return app.vault.adapter.exists(path.fullpath)
}

async function removeFromCache(file: TFile): Promise<void> {
  const path = getCachePath(file)
  if (await isInCache(file)) {
    return await app.vault.adapter.remove(path.fullpath)
  }
}

export {
  extractText,
  getOcrLangs,
  canFileBeExtracted,
  clearProcessQueue,
  isInCache,
  removeFromCache,
  getCacheBasePath,
  clearOCRWorkers,
  convertOldCachePaths,
}
