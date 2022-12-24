import { Platform, TFile } from 'obsidian'
import Tesseract, { createWorker } from 'tesseract.js'
import { getCachePath, readCache, writeCache } from './cache'
import { processQueue } from './globals'
import type { OcrOptions } from './types'

const workerTimeout = 120_000

class OCRWorker {
  static #pool: OCRWorker[] = []
  #running = false
  #ready = false

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

  static #destroyWorker(ocrWorker: OCRWorker) {
    ocrWorker.worker.terminate()
    OCRWorker.#pool = OCRWorker.#pool.filter(w => w !== ocrWorker)
  }

  private constructor(private worker: Tesseract.Worker) {}

  public async run(msg: {
    imageData: Buffer
    name: string
    options: OcrOptions
  }): Promise<{ text: string; langs: string }> {
    return new Promise(async (resolve, reject) => {
      this.#running = true
      const langs = msg.options.langs.join('+')

      if (!this.#ready) {
        await this.worker.load()
        await this.worker.loadLanguage(langs)
        await this.worker.initialize(msg.options.langs[0])
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
      return processQueue.add(() => this.#getImageText(file, options))
    } catch (e) {
      console.warn(
        `Text Extractor - Error while extracting text from ${file.basename}`
      )
      console.warn(e)
      return ''
    }
  }

  async #getImageText(file: TFile, options: OcrOptions): Promise<string> {
    const optLangs = options.langs.sort().join('+')
    // Get the text from the cache if it exists
    const cache = await readCache(file, optLangs)
    if (cache) {
      return cache.text
    }

    if (Platform.isMobile) {
      return ''
    }

    // The text is not cached, extract it
    const cachePath = getCachePath(file)
    const data = new Uint8ClampedArray(await app.vault.readBinary(file))
    const worker = OCRWorker.getWorker()

    return new Promise(async (resolve, reject) => {
      try {
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

        // Add it to the cache
        await writeCache(cachePath.folder, cachePath.filename, text, optLangs)
        resolve(text)
      } catch (e) {
        // In case of error (unreadable PDF or timeout) just add
        // an empty string to the cache
        await writeCache(cachePath.folder, cachePath.filename, '', optLangs)
        resolve('')
      }
    })
  }
}

export const ocrManager = new OCRManager()
