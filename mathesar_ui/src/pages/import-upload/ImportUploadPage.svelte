<script lang="ts">
  import { router } from 'tinro';
  import NameWithIcon from '@mathesar/components/NameWithIcon.svelte';
  import { getImportPreviewPageUrl } from '@mathesar/routes/urls';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import {
    RadioGroup,
    iconUploadFile,
    Alert,
  } from '@mathesar-component-library';
  import type { RequestStatus } from '@mathesar/api/utils/requestUtils';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import { iconUrl, iconPaste } from '@mathesar/icons';
  import { createTable } from '@mathesar/stores/tables';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import UploadViaFile from './UploadViaFile.svelte';
  import UploadViaUrl from './UploadViaUrl.svelte';
  import UploadViaClipboard from './UploadViaClipboard.svelte';

  export let database: Database;
  export let schema: SchemaEntry;

  const uploadMethods = [
    { label: 'Upload a file', component: UploadViaFile, icon: iconUploadFile },
    {
      label: 'Provide a URL to the file',
      component: UploadViaUrl,
      icon: iconUrl,
    },
    {
      label: 'Copy and Paste Text',
      component: UploadViaClipboard,
      icon: iconPaste,
    },
  ];
  let uploadMethod = uploadMethods[0];

  let uploadStatus: RequestStatus | undefined;
  let tableCreationProgress: RequestStatus | undefined;

  $: isLoading =
    uploadStatus?.state === 'processing' ||
    tableCreationProgress?.state === 'processing';
  $: isError =
    uploadStatus?.state === 'failure' ||
    tableCreationProgress?.state === 'failure';
  $: errorMessage = (() => {
    if (uploadStatus?.state === 'failure') {
      return uploadStatus.errors.join(',');
    }
    if (tableCreationProgress?.state === 'failure') {
      return tableCreationProgress.errors.join(',');
    }
    return undefined;
  })();

  async function createPreviewTable(uploadInfo: { dataFileId: number }) {
    uploadStatus = { state: 'success' };
    const { dataFileId } = uploadInfo;
    try {
      tableCreationProgress = { state: 'processing' };
      const table = await createTable(schema.id, {
        dataFiles: [dataFileId],
      });
      router.goto(getImportPreviewPageUrl(database.name, schema.id, table.id));
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to create a table from the uploaded data';
      tableCreationProgress = {
        state: 'failure',
        errors: [message],
      };
    }
  }
</script>

<svelte:head><title>{makeSimplePageTitle('Import')}</title></svelte:head>

<LayoutWithHeader
  restrictWidth
  cssVariables={{
    '--max-layout-width': '67.357rem',
    '--layout-background-color': 'var(--sand-200)',
  }}
>
  <h2>Create a table by importing your data</h2>
  <div class="import-file-view">
    {#if isLoading || isError}
      <div class="uploading-info">
        <span>Uploading Data</span>
        <Alert appearance="warning">
          Large data sets can sometimes take several minutes to process. Please
          do not leave this page or close the browser tab while import is in
          progress.
        </Alert>
      </div>
    {:else}
      <div class="upload-method-input">
        <RadioGroup
          bind:value={uploadMethod}
          options={uploadMethods}
          isInline
          label="How would you like to import your data?"
          getRadioLabel={(opt) => ({
            component: NameWithIcon,
            props: {
              name: opt.label,
              icon: opt.icon,
            },
          })}
        />
      </div>
    {/if}

    <div class="upload-section">
      <svelte:component
        this={uploadMethod.component}
        {isLoading}
        on:start={() => {
          uploadStatus = { state: 'processing' };
        }}
        on:success={(e) => createPreviewTable(e.detail)}
        on:error={(e) => {
          uploadStatus = {
            state: 'failure',
            errors: [e.detail ?? 'Upload failed'],
          };
        }}
        showCancelButton={isError}
        on:cancel={() => {
          uploadStatus = undefined;
          tableCreationProgress = undefined;
        }}
      >
        <svelte:fragment slot="errors">
          {#if errorMessage}
            <div class="errors">
              <Alert appearance="error">
                <h>Failed to import data</h>
                <span>{errorMessage}</span>
              </Alert>
            </div>
          {/if}
        </svelte:fragment>
      </svelte:component>
    </div>
  </div>
</LayoutWithHeader>

<style lang="scss">
  h2 {
    font-weight: 500;
    font-size: var(--size-super-ultra-large);
  }

  .import-file-view {
    padding: 2.2857rem;
    border: 1px solid var(--slate-300);
    border-radius: var(--border-radius-m);
    background-color: var(--white);
    margin-bottom: 2rem;

    .upload-method-input {
      font-size: var(--text-size-large);
      --spacing-x: 0.5em;

      :global(legend) {
        font-weight: 500;
      }

      :global(.option) {
        padding: 0.8rem 0;
        margin-right: 0.5rem;
      }
    }
    .uploading-info {
      span {
        display: block;
        font-size: var(--text-size-large);
        margin-bottom: var(--size-large);
      }
      :global(.alert-container) {
        font-size: var(--text-size-small);
      }
    }

    .upload-section {
      margin-top: var(--size-large);

      :global(.file-upload-section) {
        padding-top: var(--size-ultra-small);
      }

      :global(.help-content) {
        margin: 0.4rem 0;
        line-height: 1.5;
        color: var(--slate-500);
      }

      :global(.buttons) {
        margin-top: 0.9rem;
        display: flex;
        align-items: center;
      }
      :global(.buttons .continue-action) {
        margin-left: auto;
      }
    }

    .errors {
      margin-top: var(--size-large);
    }
  }
</style>
