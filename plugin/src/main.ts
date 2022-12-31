import { Plugin, TFile } from 'obsidian'
import { loadSettings, settings, TextExtractorSettingsTab } from './settings'
import * as TextExtract from 'obsidian-text-extract'

export type TextExtractorApi = {
  extractText: (file: TFile) => Promise<string>
  canFileBeExtracted: (filePath: string) => boolean
}

export default class TextExtractorPlugin extends Plugin {
  public api: TextExtractorApi = {
    async extractText(file:TFile): Promise<string> {
      const langs = settings.ocrLanguages
      return await TextExtract.extractText(file, { langs })
    },
    canFileBeExtracted: TextExtract.canFileBeExtracted,
  }

  async onload() {
    await loadSettings(this)
    this.addSettingTab(new TextExtractorSettingsTab(this))
  }

  onunload() {
    TextExtract.clearProcessQueue()
  }
}
