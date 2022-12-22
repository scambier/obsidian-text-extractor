import { Platform, TFile } from 'obsidian'
import WebWorker from 'web-worker:./pdf-worker.ts'
import { makeMD5 } from './utils'
import { processQueue } from './globals'
import { getCachePath, readCache, writeCache } from './cache'

const workerTimeout = 120_000

class PDFWorker {
  private static pool: PDFWorker[] = []
  static getWorker(): PDFWorker {
    const free = PDFWorker.pool.find(w => !w.running)
    if (free) {
      return free
    }
    const worker = new PDFWorker(new WebWorker({ name: 'PDF Text Extractor' }))
    PDFWorker.pool.push(worker)
    return worker
  }

  private running = false

  private constructor(private worker: Worker) {}

  public async run(msg: { data: Uint8Array; name: string }): Promise<any> {
    return new Promise((resolve, reject) => {
      this.running = true

      const timeout = setTimeout(() => {
        this.worker.terminate()
        console.warn('Text Extractor - PDF Worker timeout')
        reject('timeout')
        this.running = false
      }, workerTimeout)

      this.worker.postMessage(msg)
      this.worker.onmessage = evt => {
        clearTimeout(timeout)
        resolve(evt)
        this.running = false
      }
    })
  }
}

class PDFManager {
  public async getPdfText(file: TFile): Promise<string> {
    return processQueue(this._getPdfText, file)
  }

  private async _getPdfText(file: TFile): Promise<string> {
    // Get the text from the cache if it exists
    const cache = await readCache(file)
    if (cache) {
      return cache.text
    }

    if (Platform.isMobile) {
      return ''
    }

    // The PDF is not cached, extract it
    const cachePath = getCachePath(file)
    const data = new Uint8Array(await app.vault.readBinary(file))
    const hash = makeMD5(data)

    const worker = PDFWorker.getWorker()
    return new Promise(async (resolve, reject) => {
      try {
        const res = await worker.run({ data, name: file.basename })
        const text = (res.data.text as string)
          // Replace \n with spaces
          .replace(/\n/g, ' ')
          // Trim multiple spaces
          .replace(/ +/g, ' ')
          .trim()

        // Add it to the cache
        await writeCache(cachePath.folder, cachePath.filename, text)
        resolve(text)
      } catch (e) {
        // In case of error (unreadable PDF or timeout) just add
        // an empty string to the cache
        await writeCache(cachePath.folder, cachePath.filename, '')
        resolve('')
      }
    })
  }
}

export const pdfManager = new PDFManager()
