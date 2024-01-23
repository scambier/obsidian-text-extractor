import type { TFile } from 'obsidian'
import { libVersion } from './globals'
import type { ExtractedText } from './types'
import { makeMD5 } from './utils'

export function getCacheBasePath(): string {
  return `${app.vault.configDir}/plugins/text-extractor/cache`
}

export async function convertOldCachePaths(): Promise<void> {
  // Convert old cache files to new format
  // Recursively list all files in the cache folder
  const cachePath = getCacheBasePath()
  try {
    const paths = await app.vault.adapter.list(cachePath)
    for (const dir of paths.folders) {
      const files = await app.vault.adapter.list(dir)
      for (const file of files.files) {
        const hash = file.split('-').pop()?.split('.').shift()
        if (hash) {
          const newPath = `${cachePath}/${hash}.json`
          await app.vault.adapter.rename(file, newPath)
        }
      }
    }
  } catch (e) {
    // No old paths to convert
  }
}

export function getCachePath(file: TFile): {
  filename: string
  folder: string
  fullpath: string
} {
  const hash = makeMD5(file.path)

  const folder = `${getCacheBasePath()}`
  const filename = `${hash}.json`
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
export async function readCache(file: TFile): Promise<ExtractedText | null> {
  const cachePath = getCachePath(file)

  // Get the text from the cache if it exists
  if (await app.vault.adapter.exists(cachePath.fullpath)) {
    const raw = await app.vault.adapter.read(cachePath.fullpath)
    return JSON.parse(raw) as ExtractedText
  }
  return null
}

/**
 *
 * @param folder Cache folder
 * @param filename Cache filename
 * @param text Extracted text
 * @param ogPath Filepath of the extracted file
 * @param langs Extracted languages
 * @returns
 */
export async function writeCache(
  folder: string,
  filename: string,
  text: string,
  ogPath: string,
  langs: string
): Promise<void> {
  const path = `${folder}/${filename}`
  const data: ExtractedText = {
    path: ogPath,
    text,
    libVersion,
    langs,
  }
  await app.vault.adapter.mkdir(folder)
  return await app.vault.adapter.write(path, JSON.stringify(data))
}
