import { Platform } from 'obsidian'
import data from '../package.json'
import PQueue from 'p-queue'

export const libVersion = data.version

const cpuCount = Platform.isMobileApp ? 1 : require('os').cpus().length

const ocrBackgroundProcesses = cpuCount <= 2 ? 1 : 2

const officeBackgroundProcesses = 1

let PdfBackgroundProcess = Math.max(
  1,
  Math.floor(cpuCount * 0.7) - ocrBackgroundProcesses - officeBackgroundProcesses
)
if (PdfBackgroundProcess == cpuCount) {
  PdfBackgroundProcess = 1
}
// PDF.js crashes with an out-of-memory error if too many workers are used
//PdfBackgroundProcess = 1

console.info(
  `Text Extractor - Number of available workers: ${PdfBackgroundProcess} for PDFs, ${ocrBackgroundProcesses} for OCR, ${officeBackgroundProcesses} for Office`
)

export const workerTimeout = 120_000

export const pdfProcessQueue = new PQueue({
  concurrency: PdfBackgroundProcess,
  timeout: workerTimeout + 100,
})

export const imagesProcessQueue = new PQueue({
  concurrency: ocrBackgroundProcesses,
  timeout: workerTimeout + 100,
})

export const officeProcessQueue = new PQueue({
  concurrency: officeBackgroundProcesses,
  timeout: workerTimeout + 100,
})

export const FAILED_TO_EXTRACT = '[Failed to extract text]'
export const CANT_EXTRACT_ON_MOBILE = '[Cannot extract text on mobile]'
