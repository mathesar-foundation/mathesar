<script lang="ts">
  import { FileUpload } from '@mathesar/component-library';
  import type { FileImport } from '@mathesar/stores/fileImports';
  import {
    uploadNewFile,
    getFileUploadInfo,
    loadPreview,
  } from '../importUtils';

  export let fileImportStore: FileImport;

  $: if ($fileImportStore.uploadProgress?.percentCompleted === 100) {
    void loadPreview(fileImportStore);
  }
</script>

<FileUpload
  bind:fileUploads={$fileImportStore.uploads}
  fileProgress={getFileUploadInfo($fileImportStore)}
  on:add={(e) => uploadNewFile(fileImportStore, e.detail)}
/>
<div class="help-content">You can import tabular (CSV, TSV) data.</div>
