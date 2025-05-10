import { Platform, TFile } from 'obsidian'
import Tesseract, { createWorker } from 'tesseract.js'
import { getCachePath, readCache, writeCache } from '../cache'
import {
  CANT_EXTRACT_ON_MOBILE,
  FAILED_TO_EXTRACT,
  imagesProcessQueue,
  workerTimeout,
} from '../globals'
import type { OcrOptions } from '../types'
import type { ocrLangs } from './ocr-langs'
import { extractTextByMacOCR } from './ocr-mac'

/**
 * Concatenates an array of langs to a single string to be passed to Tesseract
 * e.g. ['fra', 'eng'] => 'eng+fra'
 * The langs are sorted alphabetically because it's also used a cache key
 * @param langs
 * @returns
 */
function concatLangs(langs: Array<(typeof ocrLangs)[number]>): string {
  return langs.sort().join('+')
}

class OCRWorker {
  static #pool: OCRWorker[] = []
  #running = false
  #ready = false

  private constructor(private worker: Tesseract.Worker) {}

  static getWorker(): OCRWorker {
    const free = OCRWorker.#pool.find(w => !w.#running && w.#ready)
    if (free) {
      return free
    }
    // Spawn a new worker
    const worker = new OCRWorker(
      createWorker({
        cachePath: 'tesseract-' + app.appId,
      })
    )
    OCRWorker.#pool.push(worker)
    return worker
  }

  /**
   * Forcefully terminate all workers and clear the pool
   */
  static clearWorkers() {
    OCRWorker.#pool.forEach(w => w.worker.terminate())
    OCRWorker.#pool = []
  }

  static #destroyWorker(ocrWorker: OCRWorker) {
    ocrWorker.worker.terminate()
    OCRWorker.#pool = OCRWorker.#pool.filter(w => w !== ocrWorker)
  }

  public async run(msg: {
    imageData: Buffer
    name: string
    options: OcrOptions
  }): Promise<{ text: string; langs: string }> {
    return new Promise(async (resolve, reject) => {
      this.#running = true
      const langs = concatLangs(msg.options.langs)

      if (!this.#ready) {
        await this.worker.load()
        await this.worker.loadLanguage(langs)
        await this.worker.initialize(langs)
        this.#ready = true
      }

      const timeout = setTimeout(() => {
        this.worker.terminate()
        console.warn('Text Extractor - OCR Worker timeout for ' + msg.name)
        reject('timeout')
        OCRWorker.#destroyWorker(this)
      }, workerTimeout)

      try {
        const { data } = await this.worker.recognize(msg.imageData)
        clearTimeout(timeout)
        return resolve({ text: data.text, langs })
      } catch (e) {
        console.error('Text Extractor - OCR Worker exception for ' + msg.name)
        console.error(e)
        resolve({ text: '', langs })
      } finally {
        this.#running = false
      }
    })
  }
}

class OCRManager {
  /**
   * Extract text from an image file.
   * @param file
   * @param options - An array of languages to try. If not provided, the default is English
   */
  public async getImageText(file: TFile, options: OcrOptions): Promise<string> {
    try {
      return (
        (await imagesProcessQueue.add(() =>
          this.#getImageText(file, options)
        )) ?? ''
      )
    } catch (e) {
      console.warn(
        `Text Extractor - Error while extracting text from ${file.basename}`
      )
      console.warn(e)
      return ''
    }
  }

  async #ocrByTesseract(file: TFile, options: OcrOptions): Promise<string> {
    const data = new Uint8ClampedArray(await app.vault.readBinary(file))
    const worker = OCRWorker.getWorker()

    const res = await worker.run({
      imageData: Buffer.from(data.buffer),
      name: file.basename,
      options,
    })
    const text = res.text
      // Replace \n with spaces
      .replace(/\n/g, ' ')
      // Trim multiple spaces
      .replace(/ +/g, ' ')
      .trim()
    return text
  }

  async #getImageText(file: TFile, options: OcrOptions): Promise<string> {
    // Get the text from the cache if it exists
    const cache = await readCache(file)
    if (cache) {
      return cache.text ?? FAILED_TO_EXTRACT
    }

    if (Platform.isMobileApp || !Buffer) {
      return CANT_EXTRACT_ON_MOBILE
    }

    // The text is not cached, extract it
    const cachePath = getCachePath(file)

    const useSystemOCR =
      options.useSystemOCR && Platform.isDesktopApp && Platform.isMacOS

    const langs = useSystemOCR ? '' : concatLangs(options.langs)

    return new Promise(async (resolve, reject) => {
      try {
        let text: string
        if (useSystemOCR) {
          text = await extractTextByMacOCR(file)
        } else {
          text = await this.#ocrByTesseract(file, options)
        }

        // Add it to the cache
        await writeCache(
          cachePath.folder,
          cachePath.filename,
          text,
          file.path,
          langs
        )
        resolve(text)
      } catch (e) {
        // In case of error (unreadable PDF or timeout) just add
        // an empty string to the cache
        await writeCache(
          cachePath.folder,
          cachePath.filename,
          '',
          file.path,
          langs
        )
        resolve('')
      }
    })
  }
}

export const ocrManager = new OCRManager()

export function clearOCRWorkers() {
  OCRWorker.clearWorkers()
}
