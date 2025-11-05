import type { ocrLangs } from './ocr/ocr-langs'

export type ExtractedText = {
  path: string
  text: string
  langs: string
  libVersion: string
  extractionMethod?: string
  // hash: string
  // size: number
}

export type VLMProvider = 'openai' | 'anthropic' | 'google'

export type VLMOptions = {
  enabled: boolean
  provider: VLMProvider
  apiKey: string
  model?: string
  prompt?: string
  maxTokens?: number
}

export type YOLOOptions = {
  enabled: boolean
  modelUrl?: string
  confidenceThreshold?: number
  combineWithVLM?: boolean
}

export type OcrOptions = {
  langs: Array<(typeof ocrLangs)[number]>
  useSystemOCR: boolean
  vlm?: VLMOptions
  yolo?: YOLOOptions
}
