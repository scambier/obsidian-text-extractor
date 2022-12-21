import Dexie from 'dexie'

class PDFCache extends Dexie {
  pdf!: Dexie.Table<
    {
      path: string
      hash: string
      size: number
      text: string
      libVersion: string
    },
    string
  >
  images!: Dexie.Table<
    {
      path: string
      hash: string
      size: number
      text: string
      langs: string
      libVersion: string
    },
    string
  >

  constructor() {
    super('obsidian-text-extract/cache/' + app.appId)
    this.version(4).stores({
      pdf: 'path, hash, size',
      images: 'path, hash, size',
    })
    this.clearOldDatabases()
  }

  clearOldDatabases() {
    indexedDB.deleteDatabase('obsidian-text-extract/cache')
  }
}

export const database = new PDFCache()
