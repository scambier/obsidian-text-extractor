# Obsidian Text Extract Library

> Work In Progress - Use with care, seriously.

## What is this?

A library, designed for Obsidian plugins, to extract text from PDFs and images. It works by sharing a common cache and pool of workers between all library users.

It is currently used in [Omnisearch](https://github.com/scambier/obsidian-omnisearch)

## How does it work?

Since extracting text from PDFs and images takes a lot of resource, the main idea of this library is to make a globally available pool of workers, shared among all Obsidian plugins that wish to use it. As such, it is important to **not change the namespace or indexedDB database name**. Doing so would put an unnecessary strain on Obsidian that could crash it, and more generally will waste the device's resources. Be responsible.

## Installation & Usage

First, install it **with a fixed version**:
```json
"dependencies": {
    "obsidian-text-extract": "1.0.3"
}
```

(Yes I messed up with npm, and submitted the first version as `1.0.0`. Sorry.)

To use it:
```ts
import { getPdfText, getImageText } from 'obsidian-text-extract'

async function getTextFromFile(
  file: TFile
): Promise<string> {
  let content: string
  if (file.path.endsWith('.pdf')) {
    content = await getPdfText(file)
  } else if (file.path.endsWith('.png')) {
    content = await getImageText(file)
  }
  return content
}
```

## Limitations

Text extraction does not work on mobile; calling the functions will just immediately return an empty string.

## Build

You'll need [Rust](https://doc.rust-lang.org/book/ch01-01-installation.html), [wasm-pack](https://github.com/rustwasm/wasm-pack), and [pnpm](https://pnpm.io/installation). 

```sh
$ pnpm i
$ pnpm run build
```

Rust is quite slow to compile, so the first build will take some time.