import TextExtractorPlugin from './main'
import { writable } from 'svelte/store'
import { App, Notice, PluginSettingTab, Setting } from 'obsidian'
import LangSelector from './components/LangSelector.svelte'

interface TextExtractorSettings {
  ocrLanguages: string[]
}

export class TextExtractorSettingsTab extends PluginSettingTab {
  plugin: TextExtractorPlugin

  constructor(app: App, plugin: TextExtractorPlugin) {
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

    containerEl.createEl('h2', { text: 'Settings for my awesome plugin.' })

    // Language selector

    const container = containerEl.createEl('div', {
      cls: 'setting-item',
    })
    const info = container.createDiv({ cls: 'setting-item-info' })
    info.createDiv({ cls: 'setting-item-name', text: 'OCR Languages' })
    info.createDiv({
      cls: 'setting-item-description',
      text: "A list of languages to use for OCR. e.g. if your vault contains documents in English and French, you'd want to add 'en' and 'fr' here.",
    })

    new LangSelector({
      target: container.createDiv({ cls: 'setting-item-control' }),
    })

    // // Danger zone

    // new Setting(containerEl).setName('Danger Zone').setHeading()

    // // Reset cache

    // const resetCacheDesc = new DocumentFragment()
    // resetCacheDesc.createSpan({}, span => {
    //   span.innerHTML = `Erase all Omnisearch cache data.
    //   Use this if Omnisearch results are inconsistent, missing, or appear outdated.<br>
    //   <strong style="color: var(--text-accent)">Needs a restart to fully take effect.</strong>`
    // })
    // new Setting(containerEl)
    //   .setName('Clear cache data')
    //   .setDesc(resetCacheDesc)
    //   .addButton(cb => {
    //     cb.setButtonText('Clear cache')
    //     cb.onClick(async () => {
    //       await database.clearCache()
    //       new Notice('Text Extractor - Cache cleared')
    //     })
    //   })
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
