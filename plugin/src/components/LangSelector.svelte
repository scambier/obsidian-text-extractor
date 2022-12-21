<script>
  import MultiSelect from 'svelte-multiselect'
  import { getOcrLangs } from 'obsidian-text-extract'
  import { selectedLanguages } from 'src/settings'

  const langs = getOcrLangs()
</script>

<MultiSelect
  bind:selected="{$selectedLanguages}"
  options="{langs}"
  maxSelect="{3}" />

<style>
  :global(div.multiselect) {
    color: var(--text-primary);
    border: var(--input-border-width) solid var(--background-modifier-border);
    background-color: var(--background-secondary);
  }
  :global(div.multiselect > ul.options) {
    background-color: var(--background-secondary);
  }
</style>
