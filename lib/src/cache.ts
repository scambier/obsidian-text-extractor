import type { TFile } from 'obsidian'
import { libVersion } from './globals'
import type { ExtractedText } from './types'
import { makeMD5 } from './utils'

export function getCachePath(file: TFile): {
  filename: string
  folder: string
  fullpath: string
} {
  const slug = file.path.replace(/\//g, '-')
  const hash = makeMD5(file.path)
  const subFolder = file.basename.slice(0, 2).toLowerCase()
  const folder = `${app.vault.configDir}/plugins/text-extractor/cache/${subFolder}`
  const filename = `${slug}-${hash}.json`
  return {
    folder,
    filename,
    fullpath: `${folder}/${filename}`,
  }
}

/**
 * Read the cache for a file if it exists and the languages list has not changed
 * @param file 
 * @param optLangs 
 * @returns 
 */
export async function readCache(
  file: TFile,
  optLangs = ''
): Promise<ExtractedText | null> {
  const cachePath = getCachePath(file)

  // Get the text from the cache if it exists
  if (await app.vault.adapter.exists(cachePath.fullpath)) {
    const raw = await app.vault.adapter.read(cachePath.fullpath)
    const cache = JSON.parse(raw) as ExtractedText
    // Check that the languages list has not changed since the cache was created
    if (cache.langs === optLangs) {
      return cache
    }
  }
  return null
}

export async function writeCache(
  folder: string,
  filename: string,
  text: string,
  langs = ''
): Promise<void> {
  const path = `${folder}/${filename}`
  const data: ExtractedText = {
    path,
    text,
    libVersion,
    langs,
    hash: '',
    size: 0,
  }
  await app.vault.adapter.mkdir(folder)
  return await app.vault.adapter.write(path, JSON.stringify(data))
}
