import { Plugin } from 'obsidian'
import { loadSettings, TextExtractorSettingsTab } from './settings'

// Remember to rename these classes and interfaces!

export default class TextExtractorPlugin extends Plugin {
  async onload() {
    await loadSettings(this)
    // This adds a settings tab so the user can configure various aspects of the plugin
    this.addSettingTab(new TextExtractorSettingsTab(this.app, this))
  }

  onunload() {}
}
