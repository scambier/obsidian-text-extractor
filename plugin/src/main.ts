import { Plugin } from 'obsidian'
import { loadSettings, TextExtractorSettingsTab } from './settings'
import * as api from 'obsidian-text-extract'

export default class TextExtractorPlugin extends Plugin {
  public api = {
    extractText: api.extractText,
    getOcrLangs: api.getOcrLangs,
    canFileBeExtracted: api.canFileBeExtracted,
  }

  async onload() {
    await loadSettings(this)
    this.addSettingTab(new TextExtractorSettingsTab(this))
  }
}
