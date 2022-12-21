# Obsidian Text Extractor

## What does it do?

By itself, this plugin does not do anything (yet?). It is meant to be used by other plugins like [Omnisearch](https://github.com/scambier/obsidian-omnisearch), to extract texts from images and PDFs.

It exposes a simple API to do so and caches the extracted texts to avoid doing the same work twice.

## Why?

Text extraction is a useful feature, but it is not easy to implement, and consumes a lot of resources. With this plugin, I hope to provide a unified and efficient API to extract texts from images and PDFs. This way, other plugins can use it without having to worry about the implementation details, and without having to needlessly consume resources.

With this plugin, I hope to provide a unified way to extract texts from images and PDFs, and make it available to other plugins.

## Cache & Sync

The plugin caches the extracted texts as local small .json files inside the plugin directory. Those files can be synced between your devices.

Text extraction does not work on mobile, so the plugin will use the synced cached texts if available. If not, an empty string will be returned.

## Develop alongside Obsidian Text Extractor

```ts
const extractor = app.plugins.plugins['text-extractor']?.api
if (extractor) {
    await extractor.extractText(file)
}
```

## Development

While this plugin is first developped for Omnisearch, it's totally agnostic and I'd like it to become a community effort. If you wish to submit a PR, please open an issue first so we can discuss the feature.

The plugin is split in two parts:

- The text extraction library, which does the actual work
- The plugin itself, which is a wrapper around the library and exposes some useful options to the user

Each project is in its own folder, and has its own `package.json` and `node_modules`. The library uses Rollup (easier to setup with Wasm and web workers), while the plugin uses esbuild.
