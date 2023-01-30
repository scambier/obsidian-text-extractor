import { MenuItem, Notice, Platform, Plugin, TFile } from 'obsidian'
import { loadSettings, settings, TextExtractorSettingsTab } from './settings'
import * as TextExtract from 'obsidian-text-extract'
import {
  canFileBeExtracted,
  extractText,
  isInCache,
  removeFromCache,
} from 'obsidian-text-extract'
import { createNote } from './utils'

export type TextExtractorApi = {
  extractText: (file: TFile) => Promise<string>
  canFileBeExtracted: (filePath: string) => boolean
  isInCache: (file: TFile) => Promise<boolean>
}

export default class TextExtractorPlugin extends Plugin {
  public api: TextExtractorApi = {
    async extractText(file: TFile): Promise<string> {
      const langs = settings.ocrLanguages
      return await TextExtract.extractText(file, { langs })
    },
    canFileBeExtracted: TextExtract.canFileBeExtracted,
    isInCache: TextExtract.isInCache,
  }

  async onload() {
    await loadSettings(this)
    this.addSettingTab(new TextExtractorSettingsTab(this))
    this.registerEvent(
      app.workspace.on('file-menu', (menu, file, _source) => {
        if (file instanceof TFile && canFileBeExtracted(file.path)) {
          if (Platform.isDesktopApp) {
            menu.addItem((item: MenuItem) => {
              item.setTitle('Text Extractor')
              const submenu = item.setSubmenu()

              // Copy to clipboard
              const { clipboard } = require('electron')
              submenu.addItem(item => {
                item
                  .setTitle('Extract Text to clipboard')
                  .setIcon('clipboard-copy')
                  .onClick(async () => {
                    let text = await extractTextWithNotice(file)
                    await clipboard.writeText(text)
                    new Notice('Text Extractor - Text copied to clipboard')
                  })
              })

              // Create new note
              submenu.addItem(item => {
                item
                  .setTitle('Extract text into a new note')
                  .setIcon('document')
                  .onClick(async () => {
                    let contents = await extractTextWithNotice(file)
                    contents = `${contents}\n\n![[${file.path}]]`
                    // Create a new note and open it
                    await createNote(file.basename, contents)
                  })
              })

              // Locate cache file
              if (Platform.isDesktopApp) {
                submenu.addSeparator()
                submenu.addItem(item => {
                  item
                    .setTitle('Clear cache for this file')
                    .setIcon('trash')
                    .onClick(async () => {
                      await removeFromCache(file)
                      new Notice(
                        `Text Extractor - Removed ${file.path} from cache`
                      )
                    })
                })
              }
            })
          } else {
            menu.addItem(item => {
              item
                .setTitle('Extract text into a new note')
                .setIcon('document')
                .onClick(async () => {
                  let contents = await extractTextWithNotice(file)
                  contents = `${contents}\n\n![[${file.path}]]`
                  // Create a new note and open it
                  await createNote(file.basename, contents)
                })
            })
          }
        }
      })
    )
  }

  onunload() {
    TextExtract.clearProcessQueue()
  }
}

async function extractTextWithNotice(file: TFile) {
  if (!(await isInCache(file))) {
    new Notice(
      `Text Extractor - Extracting text from file ${file.path}, please wait...`
    )
  }
  try {
    const langs = settings.ocrLanguages
    return await extractText(file, { langs })
  } catch (e) {
    new Notice(`Text Extractor - Error extracting text from file ${file.path}`)
    throw e
  }
}
