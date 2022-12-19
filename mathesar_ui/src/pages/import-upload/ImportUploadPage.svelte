<script lang="ts">
  import { router } from 'tinro';
  import NameWithIcon from '@mathesar/components/NameWithIcon.svelte';
  import { getImportPreviewPageUrl } from '@mathesar/routes/urls';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import { RadioGroup, iconUploadFile } from '@mathesar-component-library';
  import StatusIndicator from '@mathesar/components/StatusIndicator.svelte';
  import WarningBox from '@mathesar/components/message-boxes/WarningBox.svelte';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
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
  <h1>Create a table by importing your data</h1>
  <div class="import-file-view">
    {#if isLoading || isError}
      <div class="uploading-info">
        <span>Uploading Data</span>
        <WarningBox>
          Large data sets can sometimes take several minutes to process. Please
          do not leave this page or close the browser tab while import is in
          progress.
        </WarningBox>
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
        hideAllActions={tableCreationProgress?.state === 'processing'}
      >
        {#if tableCreationProgress?.state === 'processing'}
          <div class="preview-status">
            <StatusIndicator
              state="processing"
              messages={{ processing: 'Preparing Preview' }}
            />
          </div>
        {/if}

        {#if errorMessage}
          <div class="errors">
            <ErrorBox>
              <span class="title">Failed to import data</span>
              <span>{errorMessage}</span>
            </ErrorBox>
          </div>
        {/if}
      </svelte:component>
    </div>
  </div>
</LayoutWithHeader>

<style lang="scss">
  h1 {
    font-weight: 500;
    font-size: var(--size-super-ultra-large);
    margin: 0.83em 0;
  }

  .import-file-view {
    padding: var(--size-super-ultra-large);
    border: 1px solid var(--slate-300);
    border-radius: var(--border-radius-m);
    background-color: var(--white);
    margin-bottom: 2rem;

    .upload-method-input {
      font-size: var(--text-size-large);

      :global(legend) {
        font-weight: 500;
      }

      :global(.option) {
        padding: 0.8rem 0;
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

    .errors,
    .preview-status {
      margin-top: var(--size-large);
    }
    .errors {
      :global(.alert-container) {
        max-width: 100%;
      }
      .title {
        display: block;
        margin-bottom: var(--size-ultra-small);
        font-size: var(--size-large);
      }
    }
  }
</style>
