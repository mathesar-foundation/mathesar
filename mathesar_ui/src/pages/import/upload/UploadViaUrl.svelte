<script lang="ts">
  import { SpinnerButton, TextInput } from '@mathesar/component-library';
  import type { FileImport } from '@mathesar/stores/fileImports';
  import { importFromURL } from '../importUtils';

  export let fileImportStore: FileImport;

  let url: string;
</script>

<div class="help-content">Enter a URL pointing to data to download:</div>

<TextInput bind:value={url} aria-label="URL" />

<div class="buttons">
  <SpinnerButton
    onClick={() => importFromURL(fileImportStore, url)}
    label="Continue"
    disabled={!url}
  />
</div>
