import { Plugin, TFile } from 'obsidian'
import { loadSettings, TextExtractorSettingsTab } from './settings'
import * as TextExtract from 'obsidian-text-extract'

export type TextExtractorApi = {
  extractText: (
    file: TFile,
    ocrOptions?: {
      langs: string[]
    }
  ) => Promise<string>
  getOcrLangs: () => string[]
  canFileBeExtracted: (filePath: string) => boolean
}

export default class TextExtractorPlugin extends Plugin {
  public api: TextExtractorApi = {
    extractText:
      TextExtract.extractText as TextExtractorApi['extractText'],
    getOcrLangs:
      TextExtract.getOcrLangs as unknown as TextExtractorApi['getOcrLangs'],
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
