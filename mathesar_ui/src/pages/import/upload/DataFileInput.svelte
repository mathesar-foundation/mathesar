<script lang="ts">
  import { onDestroy } from 'svelte';
  import { _ } from 'svelte-i18n';
  import {
    Button,
    FileUpload as FileUploadComponent,
  } from '@mathesar-component-library';
  import type {
    CancellablePromise,
    FileUpload,
    FileUploadAddDetail,
  } from '@mathesar-component-library/types';
  import { dataFilesApi as api } from '@mathesar/api/dataFiles';
  import type { UploadCompletionOpts } from '@mathesar/api/utils/requestUtils';
  import { toast } from '@mathesar/stores/toast';

  /**
   * Keep the displayed progress at this value until the request resolves.
   */
  const MAX_DISPLAYED_COMPLETION_BEFORE_SUCCESS = 98;

  /**
   * This is used both:
   *
   * - To pass numeric values from child to parent.
   * - Also to accept `undefined` as a value from the parent when the input
   *   should be reset.
   *
   * This component is not designed to handle the parent passing numeric values
   * into dataFileId.
   */
  let dataFileId: number | undefined = undefined;
  export { dataFileId as value };

  /** Used only for child-to-parent communication via `bind` */
  export let isUploading = false;

  let fileUploads: FileUpload[] | undefined;
  let percentCompleted = 0;
  let request: CancellablePromise<{ id: number }> | undefined = undefined;

  function init() {
    dataFileId = undefined;
    isUploading = false;
    fileUploads = undefined;
    percentCompleted = 0;
    request = undefined;
  }

  // Handle reset via parent setting `dataFileId` to `undefined`.
  $: if (dataFileId === undefined) {
    init();
  }

  $: firstFileUpload = fileUploads?.[0];
  $: fileProgress = (() => {
    if (!firstFileUpload) {
      return {};
    }
    const completion = isUploading
      ? Math.min(percentCompleted, MAX_DISPLAYED_COMPLETION_BEFORE_SUCCESS)
      : 100;
    return { [firstFileUpload.fileId]: completion };
  })();

  function handleProgressChange(completionStatus: UploadCompletionOpts) {
    percentCompleted = completionStatus.percentCompleted;
  }

  async function handleAdd(e: CustomEvent<FileUploadAddDetail>) {
    try {
      const formData = new FormData();
      formData.append('file', e.detail.added[0].file);
      isUploading = true;
      request = api.addViaUpload(formData, handleProgressChange);
      const response = await request;
      dataFileId = response.id;
      isUploading = false;
      request = undefined;
    } catch (err) {
      toast.fromError(err);
      init();
    }
  }

  function cancel() {
    if (request) {
      request.cancel();
    }
    init();
  }

  onDestroy(cancel);
</script>

<FileUploadComponent bind:fileUploads {fileProgress} on:add={handleAdd} />

{#if request}
  <div class="button">
    <Button on:click={cancel}>
      {$_('cancel_upload')}
    </Button>
  </div>
{/if}

<style>
  .button {
    margin-top: 1rem;
  }
</style>
