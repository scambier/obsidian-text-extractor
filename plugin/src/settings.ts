import TextExtractorPlugin from './main'
import { writable } from 'svelte/store'
import { PluginSettingTab } from 'obsidian'
import LangSelector from './components/LangSelector.svelte'
import { ocrLangs } from 'obsidian-text-extract/dist/src/ocr-langs'

interface TextExtractorSettings {
  ocrLanguages: typeof ocrLangs[number][]
}

export class TextExtractorSettingsTab extends PluginSettingTab {
  plugin: TextExtractorPlugin

  constructor(plugin: TextExtractorPlugin) {
    super(app, plugin)
    this.plugin = plugin

    selectedLanguages.subscribe(async value => {
      settings.ocrLanguages = value
      await saveSettings(this.plugin)
    })
  }

  display(): void {
    const { containerEl } = this
    containerEl.empty()

    containerEl.createEl('h2', { text: 'Text Extractor - Settings' })

    // Language selector

    const container = containerEl.createEl('div', {
      cls: 'setting-item',
    })
    const info = container.createDiv({ cls: 'setting-item-info' })
    info.createDiv({ cls: 'setting-item-name', text: 'OCR Languages' })
    info.createDiv({
      cls: 'setting-item-description',
      text: "A list of languages to use for OCR. e.g. if your vault contains documents in English and French, you'd want to add 'eng' and 'fra' here. This settings only applies to images, not PDFs.",
    })

    new LangSelector({
      target: container.createDiv({ cls: 'setting-item-control' }),
    })
  }
}

const DEFAULT_SETTINGS: TextExtractorSettings = {
  ocrLanguages: ['eng'],
}

export const selectedLanguages = writable(DEFAULT_SETTINGS.ocrLanguages)

export let settings = Object.assign(
  {},
  DEFAULT_SETTINGS
) as TextExtractorSettings

export async function loadSettings(plugin: TextExtractorPlugin): Promise<void> {
  settings = Object.assign({}, DEFAULT_SETTINGS, await plugin.loadData())
  if (settings.ocrLanguages.length === 0) {
    settings.ocrLanguages = DEFAULT_SETTINGS.ocrLanguages
  }
  selectedLanguages.set(settings.ocrLanguages)
}

export async function saveSettings(plugin: TextExtractorPlugin): Promise<void> {
  await plugin.saveData(settings)
}
