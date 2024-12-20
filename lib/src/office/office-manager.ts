import { Platform, TFile } from 'obsidian'
import WebWorker from 'web-worker:./office-worker.ts'
import {
  CANT_EXTRACT_ON_MOBILE,
  FAILED_TO_EXTRACT,
  officeProcessQueue,
  workerTimeout,
} from '../globals'
import { getCachePath, readCache, writeCache } from '../cache'

class OfficeWorker {
  static #pool: OfficeWorker[] = []
  #running = false

  private constructor(private worker: Worker) { }

  static getWorker(): OfficeWorker {
    const free = OfficeWorker.#pool.find(w => !w.#running)
    if (free) {
      return free
    }
    // Spawn a new worker
    const worker = new OfficeWorker(new WebWorker({ name: 'Office Text Extractor' }))
    OfficeWorker.#pool.push(worker)
    return worker
  }

  static #destroyWorker(officeWorker: OfficeWorker) {
    officeWorker.worker.terminate()
    OfficeWorker.#pool = OfficeWorker.#pool.filter(w => w !== officeWorker)
  }

  public async run(msg: { data: ArrayBuffer; name: string; extension: string; }): Promise<any> {
    return new Promise((resolve, reject) => {
      this.#running = true

      const timeout = setTimeout(() => {
        console.warn('Text Extractor - Office Worker timeout for ', msg.name)
        reject('timeout')
        OfficeWorker.#destroyWorker(this)
      }, workerTimeout)

      this.worker.postMessage(msg)
      this.worker.onmessage = evt => {
        clearTimeout(timeout)
        resolve(evt)
        this.#running = false
      }
    })
  }
}

class OfficeManager {
  public async getOfficeText(file: TFile): Promise<string> {
    try {
      return await officeProcessQueue.add(() => this.#getOfficeText(file)) ?? ''
    } catch (e) {
      console.warn(
        `Text Extractor - Error while extracting text from ${file.basename}`
      )
      console.warn(e)
      return ''
    }
  }

  async #getOfficeText(file: TFile): Promise<string> {
    // Get the text from the cache if it exists
    const cache = await readCache(file)
    if (cache) {
      return cache.text ?? FAILED_TO_EXTRACT
    }

    if (Platform.isMobileApp) {
      return CANT_EXTRACT_ON_MOBILE
    }

    // The office file is not cached, extract it
    const cachePath = getCachePath(file)
    const data = await app.vault.readBinary(file)
    const worker = OfficeWorker.getWorker()

    return new Promise(async (resolve, reject) => {
      try {
        const res = await worker.run({ data, name: file.basename, extension: file.extension })
        const text = (res.data.text)
          // Replace \n with spaces
          .replace(/\n/g, ' ')
          // Trim multiple spaces
          .replace(/ +/g, ' ')
          .trim()

        // Add it to the cache
        await writeCache(cachePath.folder, cachePath.filename, text, file.path, '')
        resolve(text)
      } catch (e) {
        // In case of error (unreadable office file or timeout) just add
        // an empty string to the cache
        await writeCache(cachePath.folder, cachePath.filename, '', file.path, '')
        resolve('')
      }
    })
  }
}

export const officeManager = new OfficeManager()

