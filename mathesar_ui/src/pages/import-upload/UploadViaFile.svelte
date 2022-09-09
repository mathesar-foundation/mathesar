<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { FileUpload as FileUploadComponent } from '@mathesar/component-library';
  import type {
    FileUpload,
    FileUploadAddDetail,
  } from '@mathesar-component-library/types';
  import { uploadFile } from '@mathesar/utils/api';
  import type { UploadCompletionOpts } from '@mathesar/utils/api';

  const dispatch = createEventDispatcher<{ success: { dataFileId: number } }>();

  let uploads: FileUpload[] | undefined;
  let uploadProgress: UploadCompletionOpts | undefined;

  $: fileUploadProgress = uploads?.[0]
    ? { [uploads[0].fileId]: uploadProgress?.percentCompleted ?? 0 }
    : {};

  async function uploadNewFile(fileInformation: FileUploadAddDetail) {
    try {
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
      // Throw toast error;
      // Ask user to retry upload;
      uploads = undefined;
      uploadProgress = undefined;
    }
  }
</script>

<div class="file-upload-section">
  <FileUploadComponent
    bind:fileUploads={uploads}
    fileProgress={fileUploadProgress}
    on:add={(e) => uploadNewFile(e.detail)}
  />
  <div class="help-content">You can import tabular (CSV, TSV) data.</div>
</div>
