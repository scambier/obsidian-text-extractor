# Obsidian Text Extractor

Text extraction is a useful feature, but it is not easy to implement, and consumes a lot of resources.

**With this plugin, I hope to provide a unified way to extract texts from images & PDFs, and make it available to other plugins.** This way, other plugins can use it without having to worry about the implementation details, and without having to needlessly consume resources.

## ⚠️ Early beta

I'm [dogfooding](https://en.wikipedia.org/wiki/Eating_your_own_dog_food) this plugin with [Omnisearch](https://github.com/scambier/obsidian-omnisearch), but the public api is yet to be fully stabilized. It's unlikely it will drastically change, but don't make your own plugins critically dependent on it yet. 

## Installation

Text Extractor is not yet available on the Obsidian community plugins repository. You can install it manually by downloading the latest release from the [releases page](https://github.com/scambier/obsidian-text-extractor/releases) or by using the [BRAT plugin manager](https://github.com/TfTHacker/obsidian42-brat).

## Cache & Sync

The plugin caches the extracted texts as local small .json files inside the plugin directory. Those files can be synced between your devices.

Text extraction does not work on mobile, so the plugin will use the synced cached texts if available. If not, an empty string will be returned.

## Development _alongside_ Obsidian Text Extractor

```ts
// Add this type somewhere in your code
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

// Then, you can just use this function to get the API
export function getTextExtractor(): TextExtractorApi | undefined {
  return (app as any).plugins?.plugins?.['text-extractor'].api
}
```

## Development _of_ Obsidian Text Extractor

While this plugin is first developped for Omnisearch, it's totally agnostic and I'd like it to become a community effort. If you wish to submit a PR, please open an issue first so we can discuss the feature.

The plugin is split in two parts:

- The text extraction library, which does the actual work
- The plugin itself, which is a wrapper around the library and exposes some useful options to the user

Each project is in its own folder, and has its own `package.json` and `node_modules`. The library uses Rollup (easier to setup with Wasm and web workers), while the plugin uses esbuild.
