import { Plugin } from 'obsidian'
import { loadSettings, TextExtractorSettingsTab } from './settings'
import * as api from 'obsidian-text-extract'

// Remember to rename these classes and interfaces!

export default class TextExtractorPlugin extends Plugin {
  api = api

  async onload() {
    await loadSettings(this)
    // This adds a settings tab so the user can configure various aspects of the plugin
    this.addSettingTab(new TextExtractorSettingsTab(this.app, this))
  }

  onunload() {}
}
