import { TFile } from 'obsidian'
import { getCachePath, readCache, writeCache } from '../cache'
import { FAILED_TO_EXTRACT, imagesProcessQueue } from '../globals'
import type { YOLOOptions, VLMOptions } from '../types'
import { vlmManager } from '../vlm/vlm-manager'

/**
 * COCO dataset class names (80 classes)
 */
const COCO_CLASSES = [
  'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat',
  'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat',
  'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack',
  'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball',
  'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket',
  'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',
  'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair',
  'couch', 'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse',
  'remote', 'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink', 'refrigerator',
  'book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush'
]

/**
 * Detection result from YOLO
 */
export type Detection = {
  class: string
  confidence: number
  bbox: {
    x: number
    y: number
    width: number
    height: number
  }
}

/**
 * YOLO inference session manager
 */
class YOLOInferenceSession {
  private session: any = null
  private modelUrl: string

  constructor(modelUrl: string) {
    this.modelUrl = modelUrl
  }

  /**
   * Initialize the ONNX Runtime session
   */
  async initialize(): Promise<void> {
    if (this.session) return

    try {
      // Dynamic import to avoid bundling issues
      const ort = await import('onnxruntime-web')

      // Load the YOLO model
      this.session = await ort.InferenceSession.create(this.modelUrl)
      console.log('Text Extractor - YOLO model loaded successfully')
    } catch (e) {
      console.error('Text Extractor - Failed to load YOLO model:', e)
      throw new Error('Failed to initialize YOLO model')
    }
  }

  /**
   * Run inference on the image
   */
  async runInference(imageData: Float32Array, inputShape: number[]): Promise<any> {
    if (!this.session) {
      await this.initialize()
    }

    try {
      // Dynamic import
      const ort = await import('onnxruntime-web')

      // Create tensor from image data
      const tensor = new ort.Tensor('float32', imageData, inputShape)

      // Run inference
      const results = await this.session.run({ images: tensor })

      return results
    } catch (e) {
      console.error('Text Extractor - YOLO inference failed:', e)
      throw e
    }
  }

  /**
   * Terminate the session
   */
  async terminate(): Promise<void> {
    if (this.session) {
      await this.session.release()
      this.session = null
    }
  }
}

/**
 * YOLO Manager for object detection
 */
class YOLOManager {
  private session: YOLOInferenceSession | null = null

  /**
   * Get or create YOLO session
   */
  private getSession(modelUrl: string): YOLOInferenceSession {
    if (!this.session || this.session['modelUrl'] !== modelUrl) {
      this.session = new YOLOInferenceSession(modelUrl)
    }
    return this.session
  }

  /**
   * Extract object information from an image using YOLO
   */
  async getImageText(
    file: TFile,
    options: YOLOOptions,
    vlmOptions?: VLMOptions
  ): Promise<string> {
    try {
      return (
        (await imagesProcessQueue.add(() =>
          this.#getImageText(file, options, vlmOptions)
        )) ?? ''
      )
    } catch (e) {
      console.warn(
        `Text Extractor - Error while detecting objects in ${file.basename} using YOLO`
      )
      console.warn(e)
      return ''
    }
  }

  async #getImageText(
    file: TFile,
    options: YOLOOptions,
    vlmOptions?: VLMOptions
  ): Promise<string> {
    // Get the text from the cache if it exists
    const cache = await readCache(file)
    const cacheKey = options.combineWithVLM && vlmOptions
      ? `yolo+vlm-${vlmOptions.provider}`
      : 'yolo'

    if (cache && cache.extractionMethod === cacheKey) {
      return cache.text ?? FAILED_TO_EXTRACT
    }

    // Set default model URL if not provided
    const modelUrl = options.modelUrl ||
      'https://github.com/scambier/obsidian-text-extractor/releases/download/models/yolov8n.onnx'

    // Read and preprocess the image
    const imageData = await app.vault.readBinary(file)
    const { processedData, inputShape } = await this.#preprocessImage(imageData)

    // Get YOLO session and run inference
    const session = this.getSession(modelUrl)
    const results = await session.runInference(processedData, inputShape)

    // Post-process results to get detections
    const detections = this.#postprocessResults(
      results,
      options.confidenceThreshold || 0.5
    )

    // Generate description
    let text: string
    if (options.combineWithVLM && vlmOptions && vlmOptions.enabled) {
      // Use VLM to generate a rich description based on detected objects
      const objectList = detections.map(d => d.class).join(', ')
      const enhancedPrompt = `This image contains the following objects: ${objectList}. Please provide a detailed description of the image, including any text visible and the relationships between objects.`

      const vlmOptionsWithPrompt = { ...vlmOptions, prompt: enhancedPrompt }
      text = await vlmManager.getImageText(file, vlmOptionsWithPrompt)
    } else {
      // Generate simple text description from detections
      text = this.#generateDescription(detections)
    }

    // Add it to the cache
    const cachePath = getCachePath(file)
    await writeCache(
      cachePath.folder,
      cachePath.filename,
      text,
      file.path,
      cacheKey
    )

    return text
  }

  /**
   * Preprocess image for YOLO input
   * Expected input: [1, 3, 640, 640] - batch, channels (RGB), height, width
   */
  async #preprocessImage(
    imageData: ArrayBuffer
  ): Promise<{ processedData: Float32Array; inputShape: number[] }> {
    return new Promise((resolve, reject) => {
      const blob = new Blob([imageData])
      const url = URL.createObjectURL(blob)
      const img = new Image()

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')

          if (!ctx) {
            throw new Error('Failed to get canvas context')
          }

          // Resize to 640x640
          const size = 640
          canvas.width = size
          canvas.height = size

          // Draw and resize image
          ctx.drawImage(img, 0, 0, size, size)

          // Get image data
          const imageData = ctx.getImageData(0, 0, size, size)
          const pixels = imageData.data

          // Convert to CHW format (channels, height, width) and normalize
          const float32Data = new Float32Array(3 * size * size)

          for (let i = 0; i < pixels.length; i += 4) {
            const pixelIndex = i / 4
            const r = pixels[i] / 255
            const g = pixels[i + 1] / 255
            const b = pixels[i + 2] / 255

            // CHW format: all reds, then all greens, then all blues
            float32Data[pixelIndex] = r
            float32Data[size * size + pixelIndex] = g
            float32Data[2 * size * size + pixelIndex] = b
          }

          URL.revokeObjectURL(url)
          resolve({
            processedData: float32Data,
            inputShape: [1, 3, size, size]
          })
        } catch (e) {
          URL.revokeObjectURL(url)
          reject(e)
        }
      }

      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load image'))
      }

      img.src = url
    })
  }

  /**
   * Post-process YOLO output to extract detections
   */
  #postprocessResults(results: any, confidenceThreshold: number): Detection[] {
    const detections: Detection[] = []

    try {
      // YOLO output format: [1, 84, 8400] or similar
      // [batch, (4 bbox coords + 80 class scores), num_predictions]
      const output = results.output0 || results[Object.keys(results)[0]]
      const outputData = output.data
      const dims = output.dims

      const numClasses = dims[1] - 4 // Usually 80 for COCO
      const numPredictions = dims[2]

      for (let i = 0; i < numPredictions; i++) {
        // Get bbox coordinates (x, y, w, h)
        const x = outputData[i]
        const y = outputData[numPredictions + i]
        const w = outputData[2 * numPredictions + i]
        const h = outputData[3 * numPredictions + i]

        // Get class scores
        let maxScore = 0
        let maxClass = 0

        for (let c = 0; c < numClasses; c++) {
          const score = outputData[(4 + c) * numPredictions + i]
          if (score > maxScore) {
            maxScore = score
            maxClass = c
          }
        }

        // Filter by confidence threshold
        if (maxScore >= confidenceThreshold) {
          detections.push({
            class: COCO_CLASSES[maxClass] || `class_${maxClass}`,
            confidence: maxScore,
            bbox: { x, y, width: w, height: h }
          })
        }
      }
    } catch (e) {
      console.error('Text Extractor - Failed to post-process YOLO results:', e)
    }

    return detections
  }

  /**
   * Generate text description from detections
   */
  #generateDescription(detections: Detection[]): string {
    if (detections.length === 0) {
      return 'No objects detected in this image.'
    }

    // Count occurrences of each class
    const classCounts = new Map<string, number>()
    detections.forEach(d => {
      classCounts.set(d.class, (classCounts.get(d.class) || 0) + 1)
    })

    // Generate description
    const items = Array.from(classCounts.entries())
      .map(([className, count]) => {
        if (count === 1) {
          return `a ${className}`
        } else {
          return `${count} ${className}s`
        }
      })

    return `This image contains: ${items.join(', ')}.`
  }

  /**
   * Clear YOLO session
   */
  async clearSession(): Promise<void> {
    if (this.session) {
      await this.session.terminate()
      this.session = null
    }
  }
}

export const yoloManager = new YOLOManager()
export { COCO_CLASSES }
