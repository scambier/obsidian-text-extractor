import { MenuItem, Platform, Plugin, TFile } from 'obsidian'
import { loadSettings, settings, TextExtractorSettingsTab } from './settings'
import * as TextExtract from 'obsidian-text-extract'
import { canFileBeExtracted, extractText } from 'obsidian-text-extract'
const { clipboard } = require('electron')

export type TextExtractorApi = {
  extractText: (file: TFile) => Promise<string>
  canFileBeExtracted: (filePath: string) => boolean
}

export default class TextExtractorPlugin extends Plugin {
  public api: TextExtractorApi = {
    async extractText(file: TFile): Promise<string> {
      const langs = settings.ocrLanguages
      return await TextExtract.extractText(file, { langs })
    },
    canFileBeExtracted: TextExtract.canFileBeExtracted,
  }

  async onload() {
    await loadSettings(this)
    this.addSettingTab(new TextExtractorSettingsTab(this))
    this.registerEvent(
      app.workspace.on('file-menu', (menu, file, source) => {
        if (file instanceof TFile && canFileBeExtracted(file.path)) {
          menu.addItem((item: MenuItem) => {
            item.setTitle('Text Extractor')
            const submenu = item.setSubmenu()
            // Copy to clipboard
            if (Platform.isDesktopApp) {
              submenu.addItem(item => {
                item
                  .setTitle('Extract Text to clipboard')
                  .setIcon('clipboard-copy')
                  .onClick(async () => {
                    const text = await extractText(file)
                    clipboard.writeText(text)
                  })
              })
            }
            // Create new note
            submenu.addItem(item => {
              item
                .setTitle('Extract Text into a new note')
                .setIcon('document')
                .onClick(async () => {
                  let text = await extractText(file)
                  text = `${text}\n\n![[${file.path}]]`
                  // Create a new note and open it
                  const newFile = await app.vault.create(
                    file.basename + '.md',
                    text
                  )
                  await app.workspace.openLinkText(newFile.basename, '', true)
                })
            })
          })
        }
      })
    )
  }

  onunload() {
    TextExtract.clearProcessQueue()
  }
}
