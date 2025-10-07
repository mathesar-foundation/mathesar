<script lang="ts">
  import { _ } from 'svelte-i18n';

  import {
    type FileAttachmentUploadResult,
    uploadFileAttachment,
  } from '@mathesar/api/rest/fileAttachments';
  import type { UploadCompletionOpts } from '@mathesar/api/rest/utils/requestUtils';
  import { IndependentModal } from '@mathesar/component-library';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import { toast } from '@mathesar/stores/toast';
  import { getErrorMessage } from '@mathesar/utils/errors';
  import { FileUpload as FileUploadComponent } from '@mathesar-component-library';
  import type {
    CancellablePromise,
    FileUpload,
    FileUploadAddDetail,
  } from '@mathesar-component-library/types';

  import type ModalFileAttachmentUploadController from './ModalFileAttachmentUploadController';

  const MAX_DISPLAYED_COMPLETION_BEFORE_SUCCESS = 98;

  export let controller: ModalFileAttachmentUploadController;

  let isUploading = false;
  let fileUploads: FileUpload[] | undefined;
  let percentCompleted = 0;
  let request: CancellablePromise<FileAttachmentUploadResult> | undefined =
    undefined;
  let error = '';

  $: ({ isOpen } = controller);
  $: firstFileUpload = fileUploads?.[0];
  $: fileProgress = (() => {
    if (!firstFileUpload) return {};
    const completion = isUploading
      ? Math.min(percentCompleted, MAX_DISPLAYED_COMPLETION_BEFORE_SUCCESS)
      : 100;
    return { [firstFileUpload.fileId]: completion };
  })();

  $: title = $_('upload_file');

  function init() {
    controller.cancel();
    fileUploads = undefined;
    percentCompleted = 0;
    request?.cancel();
    request = undefined;
  }

  function handleProgressChange(completionStatus: UploadCompletionOpts) {
    percentCompleted = completionStatus.percentCompleted;
  }

  async function handleAdd(event: CustomEvent<FileUploadAddDetail>) {
    try {
      error = '';
      isUploading = true;
      const file = event.detail.added.at(0)?.file;
      if (!file) return;
      request = uploadFileAttachment(file, handleProgressChange);
      try {
        const result = await request;
        controller.submitResult(result);
      } catch (e) {
        error = getErrorMessage(e);
        init();
      }
    } catch (err) {
      toast.fromError(err);
      init();
    } finally {
      isUploading = false;
      request = undefined;
    }
  }
</script>

<IndependentModal isOpen={$isOpen} on:close={init} {title}>
  <FileUploadComponent bind:fileUploads {fileProgress} on:add={handleAdd} />
  {#if error}
    <ErrorBox --MessageBox__margin="1rem 0 0 0">
      <p><strong>{$_('error_uploading_file')}</strong></p>
      <p>{error}</p>
    </ErrorBox>
  {/if}
</IndependentModal>
