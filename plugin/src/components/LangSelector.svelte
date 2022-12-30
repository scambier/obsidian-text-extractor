<script>
  import MultiSelect from 'svelte-multiselect'
  import { getOcrLangs } from 'obsidian-text-extract'
  import { selectedLanguages } from 'src/settings'

  const langs = getOcrLangs()
</script>

<div class="text-extract">
  <MultiSelect
    bind:selected="{$selectedLanguages}"
    options="{langs}"
    maxSelect="{3}" />
</div>

<style>
  .text-extract :global(div.multiselect) {
    color: var(--text-primary);
    border: var(--input-border-width) solid var(--background-modifier-border);
    background-color: var(--background-secondary);
  }
  .text-extract :global(div.multiselect > ul.options) {
    background-color: var(--background-secondary);
  }
  .text-extract :global(div.multiselect button) {
    border-radius: 0;
  }
  .text-extract :global(button:not(.clickable-icon)) {
    background-color: transparent;
    box-shadow: none;
    width: 1em;
  }
</style>
