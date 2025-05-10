import type { ocrLangs } from './ocr/ocr-langs'

export type ExtractedText = {
  path: string
  text: string
  langs: string
  libVersion: string
  // hash: string
  // size: number
}

export type OcrOptions = {
  langs: Array<(typeof ocrLangs)[number]>
  useSystemOCR: boolean
}
