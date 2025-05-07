import { MenuItem, Notice, Platform, Plugin, TFile, App } from 'obsidian'
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
      const useSystemOCR = settings.useSystemOCR
      return await TextExtract.extractText(file, { langs, useSystemOCR })
    },
    canFileBeExtracted: TextExtract.canFileBeExtracted,
    isInCache: TextExtract.isInCache,
  }

  async onload() {
    await loadSettings(this)
    await TextExtract.convertOldCachePaths()
    this.addSettingTab(new TextExtractorSettingsTab(this))

    this.addCommand({
      id: "extract-to-clipboard",
      name: "Extract text to clipboard",
      callback: () => {
        const file = getActiveFile(this.app)
        if (file != null && canFileBeExtracted(file.path)) {
          extractToClipboard(file);
        }
      },
    });

    this.addCommand({
      id: "extract-to-new-note",
      name: "Extract text into a new note",
      callback: () => {
        const file = getActiveFile(this.app)
        if (file != null && canFileBeExtracted(file.path)) {
          extractToNewNote(file);
        }
      },
    });

    this.registerEvent(
      app.workspace.on('file-menu', (menu, file, _source) => {
        if (file instanceof TFile && canFileBeExtracted(file.path)) {
          if (Platform.isDesktopApp) {
            menu.addItem((item: MenuItem) => {
              item.setTitle('Text Extractor')
              const submenu = item.setSubmenu()

              // Copy to clipboard
              submenu.addItem(item => {
                item
                  .setTitle('Extract Text to clipboard')
                  .setIcon('clipboard-copy')
                  .onClick(async () => {
                    extractToClipboard(file)
                  })
              })

              // Create new note
              submenu.addItem(item => {
                item
                  .setTitle('Extract text into a new note')
                  .setIcon('document')
                  .onClick(async () => {
                    extractToNewNote(file)
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
                  extractToNewNote(file)
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
    const useSystemOCR = settings.useSystemOCR
    return await extractText(file, { langs, useSystemOCR })
  } catch (e) {
    new Notice(`Text Extractor - Error extracting text from file ${file.path}`)
    throw e
  }
}

async function extractToClipboard(file: TFile) {
  const { clipboard } = require('electron')
  const text = await extractTextWithNotice(file)
  await clipboard.writeText(text)
  new Notice('Text Extractor - Text copied to clipboard')
}

async function extractToNewNote(file: TFile) {
  let contents = await extractTextWithNotice(file)
  contents = `${contents}\n\n![[${file.path}]]`
  // Create a new note and open it
  await createNote(file.basename, contents)
}

function getActiveFile(app: App): TFile | null {
  return app.workspace.activeEditor?.file ?? app.workspace.getActiveFile();
}
