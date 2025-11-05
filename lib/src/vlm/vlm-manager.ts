import { TFile } from 'obsidian'
import { getCachePath, readCache, writeCache } from '../cache'
import { FAILED_TO_EXTRACT, imagesProcessQueue } from '../globals'
import type { VLMOptions, VLMProvider } from '../types'

/**
 * Default prompts for different VLM providers
 */
const DEFAULT_PROMPTS = {
  textExtraction: 'Extract all text from this image. Return only the text content, without any additional commentary or formatting.',
  imageDescription: 'Describe this image in detail, including any text, objects, and their relationships.'
}

/**
 * VLM API client for different providers
 */
class VLMClient {
  /**
   * Call OpenAI GPT-4 Vision API
   */
  async callOpenAI(
    imageBase64: string,
    options: VLMOptions
  ): Promise<string> {
    const model = options.model || 'gpt-4o'
    const prompt = options.prompt || DEFAULT_PROMPTS.textExtraction
    const maxTokens = options.maxTokens || 1000

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${options.apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: maxTokens
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI API error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || ''
  }

  /**
   * Call Anthropic Claude Vision API
   */
  async callAnthropic(
    imageBase64: string,
    options: VLMOptions
  ): Promise<string> {
    const model = options.model || 'claude-3-5-sonnet-20241022'
    const prompt = options.prompt || DEFAULT_PROMPTS.textExtraction
    const maxTokens = options.maxTokens || 1000

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': options.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: imageBase64
                }
              },
              {
                type: 'text',
                text: prompt
              }
            ]
          }
        ]
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Anthropic API error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    return data.content[0]?.text || ''
  }

  /**
   * Call Google Gemini Vision API
   */
  async callGoogle(
    imageBase64: string,
    options: VLMOptions
  ): Promise<string> {
    const model = options.model || 'gemini-1.5-flash'
    const prompt = options.prompt || DEFAULT_PROMPTS.textExtraction

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${options.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: imageBase64
                  }
                }
              ]
            }
          ]
        })
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Google API error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    return data.candidates[0]?.content?.parts[0]?.text || ''
  }

  /**
   * Route the request to the appropriate provider
   */
  async extractText(
    imageBase64: string,
    options: VLMOptions
  ): Promise<string> {
    switch (options.provider) {
      case 'openai':
        return this.callOpenAI(imageBase64, options)
      case 'anthropic':
        return this.callAnthropic(imageBase64, options)
      case 'google':
        return this.callGoogle(imageBase64, options)
      default:
        throw new Error(`Unknown VLM provider: ${options.provider}`)
    }
  }
}

/**
 * VLM Manager for extracting text from images using Vision Language Models
 */
class VLMManager {
  private client = new VLMClient()

  /**
   * Extract text from an image using VLM
   */
  async getImageText(file: TFile, options: VLMOptions): Promise<string> {
    try {
      return (
        (await imagesProcessQueue.add(() =>
          this.#getImageText(file, options)
        )) ?? ''
      )
    } catch (e) {
      console.warn(
        `Text Extractor - Error while extracting text from ${file.basename} using VLM`
      )
      console.warn(e)
      return ''
    }
  }

  async #getImageText(file: TFile, options: VLMOptions): Promise<string> {
    // Get the text from the cache if it exists
    const cache = await readCache(file)
    if (cache && cache.extractionMethod === `vlm-${options.provider}`) {
      return cache.text ?? FAILED_TO_EXTRACT
    }

    // Validate API key
    if (!options.apiKey) {
      throw new Error(`API key not provided for ${options.provider}`)
    }

    // Read the image file and convert to base64
    const imageData = await app.vault.readBinary(file)
    const imageBase64 = this.#arrayBufferToBase64(imageData)

    // Extract text using VLM
    const text = await this.client.extractText(imageBase64, options)

    // Add it to the cache
    const cachePath = getCachePath(file)
    await writeCache(
      cachePath.folder,
      cachePath.filename,
      text,
      file.path,
      `vlm-${options.provider}`
    )

    return text
  }

  /**
   * Convert ArrayBuffer to base64 string
   */
  #arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }
}

export const vlmManager = new VLMManager()
export { DEFAULT_PROMPTS }
