import TextExtractorPlugin from './main'
import { writable } from 'svelte/store'
import { Notice, Platform, PluginSettingTab, Setting } from 'obsidian'
import LangSelector from './components/LangSelector.svelte'
import {
  getOcrLangs,
  getCacheBasePath,
  clearOCRWorkers,
} from 'obsidian-text-extract'
import type { VLMProvider } from 'obsidian-text-extract'

interface TextExtractorSettings {
  ocrLanguages: ReturnType<typeof getOcrLangs>[number][]
  rightClickMenu: boolean
  useSystemOCR: boolean
  // VLM settings
  useVLM: boolean
  vlmProvider: VLMProvider
  vlmApiKey: string
  vlmModel: string
  vlmPrompt: string
  vlmMaxTokens: number
  // YOLO settings
  useYOLO: boolean
  yoloModelUrl: string
  yoloConfidenceThreshold: number
  yoloCombineWithVLM: boolean
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

    //#region VLM Settings
    new Setting(containerEl).setName('Vision Language Models (VLM)').setHeading()

    new Setting(containerEl)
      .setName('Enable VLM')
      .setDesc(
        'Use Vision Language Models (OpenAI GPT-4 Vision, Claude, or Gemini) for text extraction. This provides better accuracy but requires an API key and internet connection.'
      )
      .addToggle(toggle => {
        toggle.setValue(settings.useVLM).onChange(async v => {
          settings.useVLM = v
          await saveSettings(this.plugin)
          this.display() // Refresh to show/hide VLM settings
        })
      })

    if (settings.useVLM) {
      new Setting(containerEl)
        .setName('VLM Provider')
        .setDesc('Choose your preferred Vision Language Model provider')
        .addDropdown(dropdown => {
          dropdown
            .addOption('openai', 'OpenAI (GPT-4 Vision)')
            .addOption('anthropic', 'Anthropic (Claude)')
            .addOption('google', 'Google (Gemini)')
            .setValue(settings.vlmProvider)
            .onChange(async v => {
              settings.vlmProvider = v as VLMProvider
              await saveSettings(this.plugin)
            })
        })

      new Setting(containerEl)
        .setName('API Key')
        .setDesc(`Enter your ${settings.vlmProvider} API key`)
        .addText(text => {
          text
            .setPlaceholder('sk-...')
            .setValue(settings.vlmApiKey)
            .onChange(async v => {
              settings.vlmApiKey = v
              await saveSettings(this.plugin)
            })
          text.inputEl.type = 'password'
        })

      new Setting(containerEl)
        .setName('Model (optional)')
        .setDesc(
          'Specify a model name. Leave empty to use the default model for the selected provider.'
        )
        .addText(text => {
          text
            .setPlaceholder('e.g., gpt-4o, claude-3-5-sonnet-20241022')
            .setValue(settings.vlmModel)
            .onChange(async v => {
              settings.vlmModel = v
              await saveSettings(this.plugin)
            })
        })

      new Setting(containerEl)
        .setName('Custom Prompt (optional)')
        .setDesc(
          'Customize the prompt sent to the VLM. Leave empty to use the default text extraction prompt.'
        )
        .addTextArea(text => {
          text
            .setPlaceholder('Extract all text from this image...')
            .setValue(settings.vlmPrompt)
            .onChange(async v => {
              settings.vlmPrompt = v
              await saveSettings(this.plugin)
            })
          text.inputEl.rows = 3
        })

      new Setting(containerEl)
        .setName('Max Tokens')
        .setDesc('Maximum number of tokens in the response')
        .addText(text => {
          text
            .setPlaceholder('1000')
            .setValue(settings.vlmMaxTokens.toString())
            .onChange(async v => {
              const num = parseInt(v)
              if (!isNaN(num) && num > 0) {
                settings.vlmMaxTokens = num
                await saveSettings(this.plugin)
              }
            })
        })
    }
    //#endregion VLM Settings

    //#region YOLO Settings
    new Setting(containerEl).setName('YOLO Object Detection').setHeading()

    new Setting(containerEl)
      .setName('Enable YOLO')
      .setDesc(
        'Use YOLO (You Only Look Once) for object detection in images. Runs locally in your browser using ONNX Runtime.'
      )
      .addToggle(toggle => {
        toggle.setValue(settings.useYOLO).onChange(async v => {
          settings.useYOLO = v
          await saveSettings(this.plugin)
          this.display() // Refresh to show/hide YOLO settings
        })
      })

    if (settings.useYOLO) {
      new Setting(containerEl)
        .setName('Model URL (optional)')
        .setDesc(
          'URL to a YOLO ONNX model. Leave empty to use the default YOLOv8n model.'
        )
        .addText(text => {
          text
            .setPlaceholder('https://...')
            .setValue(settings.yoloModelUrl)
            .onChange(async v => {
              settings.yoloModelUrl = v
              await saveSettings(this.plugin)
            })
        })

      new Setting(containerEl)
        .setName('Confidence Threshold')
        .setDesc('Minimum confidence score for object detection (0.0 - 1.0)')
        .addSlider(slider => {
          slider
            .setLimits(0, 1, 0.05)
            .setValue(settings.yoloConfidenceThreshold)
            .setDynamicTooltip()
            .onChange(async v => {
              settings.yoloConfidenceThreshold = v
              await saveSettings(this.plugin)
            })
        })

      if (settings.useVLM) {
        new Setting(containerEl)
          .setName('Combine YOLO with VLM')
          .setDesc(
            'Use YOLO to detect objects, then send the object list to VLM for a richer description.'
          )
          .addToggle(toggle => {
            toggle.setValue(settings.yoloCombineWithVLM).onChange(async v => {
              settings.yoloCombineWithVLM = v
              await saveSettings(this.plugin)
            })
          })
      }
    }
    //#endregion YOLO Settings

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
  // VLM settings
  useVLM: false,
  vlmProvider: 'openai',
  vlmApiKey: '',
  vlmModel: '',
  vlmPrompt: '',
  vlmMaxTokens: 1000,
  // YOLO settings
  useYOLO: false,
  yoloModelUrl: '',
  yoloConfidenceThreshold: 0.5,
  yoloCombineWithVLM: false,
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
