import type {} from 'obsidian'

declare module 'obsidian' {
  interface App {
    appId: string
  }

  interface MenuItem {
    setSubmenu(): Menu
  }

  interface Vault {
    getConfig(arg0: string): unknown
  }
}
