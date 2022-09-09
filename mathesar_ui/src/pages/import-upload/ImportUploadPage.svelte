<script lang="ts">
  import { router } from 'tinro';
  import { getImportPreviewPageUrl } from '@mathesar/routes/urls';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import { RadioGroup } from '@mathesar-component-library';
  import type { RequestStatus } from '@mathesar/utils/api';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import { createTable } from '@mathesar/stores/tables';
  import UploadViaFile from './UploadViaFile.svelte';
  import UploadViaUrl from './UploadViaUrl.svelte';
  import UploadViaClipboard from './UploadViaClipboard.svelte';

  export let database: Database;
  export let schema: SchemaEntry;

  const uploadMethods = [
    { label: 'Upload a file', component: UploadViaFile },
    { label: 'Provide a URL to the file', component: UploadViaUrl },
    { label: 'Copy and Paste Text', component: UploadViaClipboard },
  ];
  let uploadMethod = uploadMethods[0];

  let tableCreationProgress: RequestStatus;

  async function createPreviewTable(uploadInfo: { dataFileId: number }) {
    const { dataFileId } = uploadInfo;
    try {
      tableCreationProgress = { state: 'processing' };
      const table = await createTable(schema.id, {
        dataFiles: [dataFileId],
      });
      router.goto(getImportPreviewPageUrl(database.name, schema.id, table.id));
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Unable to create a table from the uploaded data';
      // Throw toast here?
      tableCreationProgress = {
        state: 'failure',
        errors: [errorMessage],
      };
    }
  }
</script>

<LayoutWithHeader>
  <div class="import-file-view">
    <h2>Create a table by importing your data</h2>

    <div class="upload-method-input">
      <RadioGroup
        bind:value={uploadMethod}
        options={uploadMethods}
        isInline
        label="How would you like to import your data?"
      />
    </div>

    <div class="upload-section">
      <svelte:component
        this={uploadMethod.component}
        on:start
        on:success={(e) => createPreviewTable(e.detail)}
        on:error
        on:cancel
      />
    </div>

    <div class="help-content bounded">
      Large data sets can sometimes take several minutes to process.
      <strong>
        Please do not leave this page or close the browser tab while import is
        in progress.
      </strong>
    </div>
  </div>
</LayoutWithHeader>

<style lang="scss">
  .import-file-view {
    /**
     * Temporary style. This is in place
     * until we have a dedicated layout
     * for it.
     */
    max-width: 900px;
    margin-left: auto;
    margin-right: auto;
  }

  .upload-method-input {
    :global(.option) {
      border: 1px solid var(--color-gray-light);
      border-radius: 0.2rem;
      padding: 0.5rem 0.7rem;
      font-weight: 500;
    }
  }

  .upload-section {
    border-top: 1px solid var(--color-gray-lighter);
    padding-top: 0.9rem;
    margin: 0.9rem 0;

    :global(.file-upload-section) {
      margin-top: 1.1rem;
    }

    :global(.help-content) {
      margin: 0.4rem 0;
      line-height: 1.5;
    }

    :global(.buttons) {
      margin-top: 0.9rem;
      text-align: right;
    }
  }

  .help-content.bounded {
    border: 1px solid var(--color-gray-light);
    background: var(--color-gray-lighter);
    padding: 0.6rem 1rem;
    line-height: 1.6;
    margin-top: 2rem;
    border-radius: 0.2rem;
  }
</style>
