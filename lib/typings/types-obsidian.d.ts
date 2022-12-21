import type { MetadataCache, ViewState, Vault } from 'obsidian'

declare module 'obsidian' {
  interface App {
    appId: string
  }
}


