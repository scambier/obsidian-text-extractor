import type { ocrLangs } from "./ocr-langs"

export type ExtractedText = {
  path: string
  hash: string
  size: number
  text: string
  langs: string
  libVersion: string
}

export type OcrOptions = { langs: Array<typeof ocrLangs[number]> }
