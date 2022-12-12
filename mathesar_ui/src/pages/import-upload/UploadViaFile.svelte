<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import {
    FileUpload as FileUploadComponent,
    Button,
  } from '@mathesar-component-library';
  import type {
    FileUpload,
    FileUploadAddDetail,
  } from '@mathesar-component-library/types';
  import { uploadFile } from '@mathesar/api/utils/requestUtils';
  import type { UploadCompletionOpts } from '@mathesar/api/utils/requestUtils';
  import type { UploadEvents } from './uploadUtils';

  const dispatch = createEventDispatcher<UploadEvents>();

  export let isLoading: boolean;
  export let showCancelButton: boolean;
  export let hideAllActions = false;

  let uploads: FileUpload[] | undefined;
  let uploadProgress: UploadCompletionOpts | undefined;

  $: fileUploadProgress = uploads?.[0]
    ? { [uploads[0].fileId]: uploadProgress?.percentCompleted ?? 0 }
    : {};

  async function uploadNewFile(fileInformation: FileUploadAddDetail) {
    try {
      dispatch('start');
      const { added } = fileInformation;
      const { file } = added[0];

      const formData = new FormData();
      formData.append('file', file);
      const response = await uploadFile<{ id: number }>(
        '/api/db/v0/data_files/',
        formData,
        (completionStatus: UploadCompletionOpts) => {
          uploadProgress = completionStatus;
          if (completionStatus.percentCompleted > 98) {
            uploadProgress = {
              ...uploadProgress,
              // Keep upload percent at 98 until import request fully completes
              percentCompleted: 98,
            };
          }
        },
      );
      if (uploadProgress) {
        uploadProgress = {
          ...uploadProgress,
          percentCompleted: 100,
        };
      }
      dispatch('success', { dataFileId: response.id });
    } catch (err) {
      uploads = undefined;
      uploadProgress = undefined;
      dispatch('error', err instanceof Error ? err.message : undefined);
    }
  }
</script>

<div class="file-upload-section">
  <FileUploadComponent
    bind:fileUploads={uploads}
    fileProgress={fileUploadProgress}
    disabled={isLoading}
    on:add={(e) => uploadNewFile(e.detail)}
  />
  {#if !uploadProgress}
    <div class="help-content">
      The file must be in tabular format (CSV, TSV etc.)
    </div>
  {/if}
</div>

<slot />

{#if !hideAllActions && showCancelButton}
  <div class="buttons">
    <Button appearance="secondary" on:click={() => dispatch('cancel')}>
      Cancel
    </Button>
  </div>
{/if}
