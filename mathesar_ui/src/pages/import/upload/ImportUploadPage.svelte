<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { router } from 'tinro';

  import { dataFilesApi } from '@mathesar/api/rest/dataFiles';
  import type { RequestStatus } from '@mathesar/api/rest/utils/requestUtils';
  import type { Schema } from '@mathesar/api/rpc/schemas';
  import Spinner from '@mathesar/component-library/spinner/Spinner.svelte';
  import DocsLink from '@mathesar/components/DocsLink.svelte';
  import {
    Field,
    FieldLayout,
    FormSubmit,
    makeForm,
    requiredField,
  } from '@mathesar/components/form';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import WarningBox from '@mathesar/components/message-boxes/WarningBox.svelte';
  import NameWithIcon from '@mathesar/components/NameWithIcon.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import { iconPaste, iconUrl } from '@mathesar/icons';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import type { Database } from '@mathesar/models/Database';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import { getImportPreviewPageUrl } from '@mathesar/routes/urls';
  import { createTable } from '@mathesar/stores/tables';
  import { getErrorMessage } from '@mathesar/utils/errors';
  import {
    RadioGroup,
    TextArea,
    assertExhaustive,
    iconUploadFile,
  } from '@mathesar-component-library';
  import type { IconProps } from '@mathesar-component-library/types';

  import ColumnTypeInferenceInput from '../inference/ColumnTypeInferenceInput.svelte';

  import DataFileInput from './DataFileInput.svelte';

  export let database: Database;
  export let schema: Schema;

  interface UploadMethod {
    key: 'file' | 'url' | 'clipboard';
    label: string;
    icon: IconProps;
  }
  const uploadMethods: UploadMethod[] = [
    {
      key: 'file',
      label: $_('upload_a_file'),
      icon: iconUploadFile,
    },
    {
      key: 'url',
      label: $_('provide_url_to_file'),
      icon: iconUrl,
    },
    {
      key: 'clipboard',
      label: $_('copy_and_paste_text'),
      icon: iconPaste,
    },
  ];

  const uploadMethod = requiredField<UploadMethod>(uploadMethods[0]);
  const urlToFile = requiredField('');
  const clipboardContent = requiredField('');
  const fileUploadId = requiredField<number | undefined>(undefined);
  const useColumnTypeInference = requiredField(true);

  $: form = (() => {
    const commonFields = { uploadMethod, useColumnTypeInference };
    if ($uploadMethod.key === 'file') {
      return makeForm({ ...commonFields, fileUploadId });
    }
    if ($uploadMethod.key === 'url') {
      return makeForm({ ...commonFields, urlToFile });
    }
    if ($uploadMethod.key === 'clipboard') {
      return makeForm({ ...commonFields, clipboardContent });
    }
    return assertExhaustive($uploadMethod.key);
  })();

  let status: RequestStatus | undefined;

  function reset() {
    form.reset();
    status = undefined;
  }

  async function getDataFileId() {
    if ($uploadMethod.key === 'file') {
      if ($fileUploadId === undefined) {
        throw new Error($_('no_file_uploaded'));
      }
      return $fileUploadId;
    }
    if ($uploadMethod.key === 'url') {
      return (await dataFilesApi.addViaUrlToFile($urlToFile)).id;
    }
    if ($uploadMethod.key === 'clipboard') {
      return (await dataFilesApi.addViaText($clipboardContent)).id;
    }
    return assertExhaustive($uploadMethod.key);
  }

  async function proceed() {
    try {
      status = { state: 'processing' };
      const dataFileId = await getDataFileId();
      if (dataFileId === undefined) {
        return;
      }
      const tableOid = await createTable(database, schema, {
        dataFiles: [dataFileId],
      });
      const previewPage = getImportPreviewPageUrl(
        database.id,
        schema.oid,
        tableOid,
        { useColumnTypeInference: $useColumnTypeInference },
      );
      router.goto(previewPage, true);
      status = undefined;
    } catch (err) {
      status = { state: 'failure', errors: [getErrorMessage(err)] };
    }
  }
</script>

<svelte:head>
  <title>{makeSimplePageTitle($_('import'))}</title>
</svelte:head>

<LayoutWithHeader
  restrictWidth
  cssVariables={{
    '--page-padding': 'var(--inset-page-padding)',
    '--max-layout-width': 'var(--max-layout-width-data-pages)',
    '--layout-background-color': 'var(--sand-200)',
  }}
>
  <h1>{$_('create_a_table_by_importing')}</h1>

  <div class="import-file-view">
    {#if status?.state === 'processing'}
      <h2>{$_('processing_data')}</h2>
      <div class="processing-spinner">
        <Spinner />
      </div>
      <WarningBox>
        {$_('large_data_takes_time_warning')}
      </WarningBox>
    {:else if status?.state === 'failure'}
      <ErrorBox>
        <ul>
          {#each status.errors as error}
            <li>{error}</li>
          {/each}
        </ul>
      </ErrorBox>
    {:else}
      <FieldLayout>
        <RadioGroup
          boxed
          bind:value={$uploadMethod}
          options={uploadMethods}
          isInline
          label={$_('data_source')}
          getRadioLabel={(opt) => ({
            component: NameWithIcon,
            props: { name: opt.label, icon: opt.icon },
          })}
        >
          <div class="data-source-detail" slot="extra">
            <div class="data-source-input">
              {#if $uploadMethod.key === 'file'}
                <DataFileInput bind:value={$fileUploadId} />
              {:else if $uploadMethod.key === 'url'}
                <Field
                  field={urlToFile}
                  layout="stacked"
                  label={$_('enter_url_import_file')}
                />
              {:else if $uploadMethod.key === 'clipboard'}
                <Field
                  field={clipboardContent}
                  label={$_('paste_data_import')}
                  layout="stacked"
                  input={{ component: TextArea, props: { rows: 10 } }}
                />
              {:else}
                {assertExhaustive($uploadMethod.key)}
              {/if}
            </div>
            <div class="upload-format-help">
              <RichText
                text={$_('data_tabular_format_help')}
                let:slotName
                let:translatedArg
              >
                {#if slotName === 'documentationLink'}
                  <DocsLink path="/user-guide/importing-data/">
                    {translatedArg}
                  </DocsLink>
                {/if}
              </RichText>
            </div>
          </div>
        </RadioGroup>
      </FieldLayout>

      <Field
        field={useColumnTypeInference}
        input={{ component: ColumnTypeInferenceInput }}
      />

      <FieldLayout>
        <FormSubmit
          {form}
          onProceed={proceed}
          onCancel={reset}
          cancelButton={{ label: $_('reset') }}
          canCancel={$form.hasChanges}
        />
      </FieldLayout>
    {/if}
  </div>
</LayoutWithHeader>

<style>
  .import-file-view {
    padding: var(--size-xx-large);
    border: 1px solid var(--slate-300);
    border-radius: var(--border-radius-m);
    background-color: var(--white);
    margin-bottom: 2rem;
  }

  .data-source-input {
    margin: 1rem 0;
  }

  .upload-format-help {
    line-height: 1.2;
    color: var(--slate-500);
    text-align: right;
    font-size: var(--text-size-small);
  }

  .processing-spinner {
    color: var(--slate-400);
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }
</style>
