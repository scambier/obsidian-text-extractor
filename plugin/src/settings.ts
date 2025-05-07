import TextExtractorPlugin from './main'
import { writable } from 'svelte/store'
import { Notice, Platform, PluginSettingTab, Setting } from 'obsidian'
import LangSelector from './components/LangSelector.svelte'
import {
  getOcrLangs,
  getCacheBasePath,
  clearOCRWorkers,
} from 'obsidian-text-extract'

interface TextExtractorSettings {
  ocrLanguages: ReturnType<typeof getOcrLangs>[number][]
  rightClickMenu: boolean
  useSystemOCR: boolean
}

export class TextExtractorSettingsTab extends PluginSettingTab {
  plugin: TextExtractorPlugin

  constructor(plugin: TextExtractorPlugin) {
    super(app, plugin)
    this.plugin = plugin

    selectedLanguages.subscribe(async value => {
      settings.ocrLanguages = value
      clearOCRWorkers()
      await saveSettings(this.plugin)
    })
  }

  display(): void {
    const { containerEl } = this
    containerEl.empty()

    containerEl.createEl('h2', { text: 'Text Extractor - Settings' })

    // use system OCR
    if (Platform.isDesktopApp && Platform.isMacOS) {
      new Setting(containerEl)
        .setName('Use system OCR')
        .setDesc(
          'If enabled, Text Extractor will use the system OCR instead of Tesseract. The OCR language will be detected automatically.'
        )
        .addToggle(toggle => {
          toggle.setValue(settings.useSystemOCR).onChange(async v => {
            settings.useSystemOCR = v
            if (v) {
              clearOCRWorkers()
            }
            await saveSettings(this.plugin)
          })
        })
    }

    // Language selector

    const container = containerEl.createEl('div', {
      cls: 'setting-item',
    })
    const info = container.createDiv({ cls: 'setting-item-info' })
    info.createDiv({ cls: 'setting-item-name', text: 'OCR Languages' })
    info.createDiv({
      cls: 'setting-item-description',
      text: `A list of languages to use for OCR. e.g. if your vault contains documents in English and French, you'd want to add 'eng' and 'fra' here.
        This setting only applies to images, not PDFs. You may have to clear the cache after changing this setting.`,
    })

    new LangSelector({
      target: container.createDiv({ cls: 'setting-item-control' }),
    })

    // Right click menu
    new Setting(containerEl)
      .setName('Right click menu')
      .setDesc(
        'Add "Text Extractor" actions to the right click menu in the file explorer.'
      )
      .addToggle(toggle => {
        toggle.setValue(settings.rightClickMenu).onChange(async v => {
          settings.rightClickMenu = v
          await saveSettings(this.plugin)
        })
      })

    //#region Danger Zone
    new Setting(containerEl).setName('Danger Zone').setHeading()

    const resetCacheDesc = new DocumentFragment()
    resetCacheDesc.createSpan({}, span => {
      span.innerHTML = `Erase all Text Extractor cache data. Use this if you want to re-extract all your files, e.g after a change in language settings.<br>
        Be careful that re-extracting all your files can take a long time.`
    })
    new Setting(containerEl)
      .setName('Clear cache data')
      .setDesc(resetCacheDesc)
      .addButton(cb => {
        cb.setButtonText('Clear cache')
        cb.onClick(async () => {
          await app.vault.adapter.rmdir(getCacheBasePath(), true)
          new Notice('Text Extract - Cache cleared.')
        })
      })
    //#endregion Danger Zone
  }
}

const DEFAULT_SETTINGS: TextExtractorSettings = {
  ocrLanguages: ['eng'],
  rightClickMenu: true,
  useSystemOCR: false,
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
