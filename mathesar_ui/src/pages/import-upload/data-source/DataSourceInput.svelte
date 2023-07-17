<script lang="ts">
  import { router } from 'tinro';

  import { RadioGroup, iconUploadFile } from '@mathesar-component-library';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import type { RequestStatus } from '@mathesar/api/utils/requestUtils';
  import NameWithIcon from '@mathesar/components/NameWithIcon.svelte';
  import StatusIndicator from '@mathesar/components/StatusIndicator.svelte';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import WarningBox from '@mathesar/components/message-boxes/WarningBox.svelte';
  import { iconPaste, iconUrl } from '@mathesar/icons';
  import { getImportPreviewPageUrl } from '@mathesar/routes/urls';
  import { createTable } from '@mathesar/stores/tables';
  import UploadViaClipboard from './UploadViaClipboard.svelte';
  import UploadViaFile from './UploadViaFile.svelte';
  import UploadViaUrl from './UploadViaUrl.svelte';
  import UploadFormatHelp from './UploadFormatHelp.svelte';

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
      label: 'Copy and paste text',
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
      const table = await createTable(database, schema, {
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

<div class="import-file-view">
  {#if isLoading || isError}
    <div class="uploading-info">
      <span>Uploading Data</span>
      <WarningBox>
        Large data sets can sometimes take several minutes to process. Please do
        not leave this page or close the browser tab while import is in
        progress.
      </WarningBox>
    </div>
  {:else}
    <RadioGroup
      boxed
      bind:value={uploadMethod}
      options={uploadMethods}
      isInline
      label="Data source"
      getRadioLabel={(opt) => ({
        component: NameWithIcon,
        props: {
          name: opt.label,
          icon: opt.icon,
        },
      })}
    >
      <div class="data-source-detail" slot="extra">
        <div class="data-source-input">
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
          />
        </div>
        <UploadFormatHelp />
      </div>
    </RadioGroup>
  {/if}
</div>

<style lang="scss">
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

  .data-source-input {
    margin: 1rem 0;
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
</style>
