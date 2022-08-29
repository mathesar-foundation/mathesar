<script lang="ts">
  import { SpinnerButton, TextArea } from '@mathesar/component-library';
  import type { FileImport } from '@mathesar/stores/fileImports';
  import { importFromText } from '../importUtils';

  export let fileImportStore: FileImport;

  let clipboardContent = '';
</script>

<div class="help-content">Paste your data below:</div>

<TextArea bind:value={clipboardContent} rows={10} />

<div class="buttons">
  <SpinnerButton
    onClick={() => importFromText(fileImportStore, clipboardContent)}
    label="Continue"
    disabled={!clipboardContent}
  />
</div>
