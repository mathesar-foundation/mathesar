<script lang="ts">
  import { router } from 'tinro';

  import {
    CancelOrProceedButtonPair,
    LabeledInput,
    Spinner,
    TextInput,
  } from '@mathesar-component-library';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import { columnsApi } from '@mathesar/api/columns';
  import { dataFilesApi } from '@mathesar/api/dataFiles';
  import type { TableEntry } from '@mathesar/api/types/tables';
  import type { Column } from '@mathesar/api/types/tables/columns';
  import { FieldLayout } from '@mathesar/components/form';
  import InfoBox from '@mathesar/components/message-boxes/InfoBox.svelte';
  import { iconDeleteMajor } from '@mathesar/icons';
  import InsetPageLayout from '@mathesar/layouts/InsetPageLayout.svelte';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import {
    getImportPreviewPageUrl,
    getSchemaPageUrl,
    getTablePageUrl,
  } from '@mathesar/routes/urls';
  import AsyncStore from '@mathesar/stores/AsyncStore';
  import { currentDbAbstractTypes } from '@mathesar/stores/abstract-types';
  import {
    deleteTable,
    generateTablePreview,
    getTableFromStoreOrApi,
    getTypeSuggestionsForTable,
    patchTable,
  } from '@mathesar/stores/tables';
  import { toast } from '@mathesar/stores/toast';
  import ColumnNamingStrategyInput from '../column-names/ColumnNamingStrategyInput.svelte';
  import ColumnTypeInferenceInput from '../inference/ColumnTypeInferenceInput.svelte';
  import ErrorInfo from './ErrorInfo.svelte';
  import ImportPreview from './ImportPreview.svelte';
  import {
    buildColumnPropertiesMap,
    finalizeColumns,
    getSkeletonRecords,
    makeHeaderUpdateRequest,
    processColumns,
  } from './importPreviewPageUtils';

  /** Set via back-end */
  const TRUNCATION_LIMIT = 20;

  const columnsFetch = new AsyncStore(columnsApi.list);
  const dataFileFetch = new AsyncStore(dataFilesApi.get);
  const previewRequest = new AsyncStore(generateTablePreview);
  const typeSuggestionsRequest = new AsyncStore(getTypeSuggestionsForTable);
  const headerUpdate = makeHeaderUpdateRequest();

  export let database: Database;
  export let schema: SchemaEntry;
  export let tableId: number;
  export let useColumnTypeInference = false;

  let tableName = '';
  let firstRowIsHeader = true;
  let table: TableEntry;
  let columns: Column[] = [];
  let columnPropertiesMap = buildColumnPropertiesMap([]);

  $: records =
    $previewRequest.settlement?.state === 'resolved'
      ? $previewRequest.settlement.value.records
      : getSkeletonRecords();
  $: formInputsAreDisabled = !$previewRequest.isOk || $headerUpdate.isLoading;
  $: canProceed = $previewRequest.isOk && $headerUpdate.isStable;
  $: processedColumns = processColumns(columns, $currentDbAbstractTypes.data);
  $: url = getImportPreviewPageUrl(database.name, schema.id, tableId, {
    useColumnTypeInference,
  });
  $: router.goto(url, true);

  async function init(_tableId: number) {
    if (tableId !== table?.id) {
      // TODO need loading spinner for this
      table = await getTableFromStoreOrApi(tableId);
      // TODO maybe don't change it if the user has customized it
      tableName = table.name;
    }
    const columnData = await columnsFetch.run(tableId);
    columns = columnData.resolvedValue?.results ?? [];
    columnPropertiesMap = buildColumnPropertiesMap(columns);

    const dataFileId = table.data_files?.[0];
    if (table.import_verified || dataFileId === undefined) {
      router.goto(getTablePageUrl(database.name, schema.id, table.id));
      return;
    }

    if (useColumnTypeInference) {
      const response = await typeSuggestionsRequest.run(tableId);
      if (response.settlement?.state === 'resolved') {
        const typeSuggestions = response.settlement.value;
        columns = columns.map((column) => ({
          ...column,
          type: typeSuggestions[column.name] ?? column.type,
        }));
      }
    }

    await Promise.all([
      dataFileFetch.run(dataFileId),
      previewRequest.run({ id: tableId, columns: columns }),
    ]);
  }

  $: void init(tableId);

  async function updateDataFileHeader() {
    headerUpdate.run({
      database,
      dataFileId: 0, // TODO
      firstRowIsHeader,
      schema,
      tableId,
      tableName,
    });
  }

  async function updateInference() {
    // TODO
  }

  function updateTypeRelatedOptions(updatedColumn: Column) {
    columns = columns.map((c) =>
      c.id === updatedColumn.id ? updatedColumn : c,
    );
    return previewRequest.run({ id: tableId, columns });
  }

  function handleCancel() {
    // TODO wrap in an AsyncStore
    void deleteTable(database, schema, tableId).catch((err) => {
      const errorMessage =
        err instanceof Error ? err.message : 'Unable to cancel import';
      toast.error(errorMessage);
    });
    router.goto(getSchemaPageUrl(database.name, schema.id), true);
  }

  async function finishImport() {
    try {
      await patchTable(tableId, {
        name: tableName,
        import_verified: true,
        columns: finalizeColumns(columns, columnPropertiesMap),
      });
      router.goto(getTablePageUrl(database.name, schema.id, tableId), true);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unable to save table';
      toast.error(errorMessage);
    }
  }
</script>

<svelte:head><title>{makeSimplePageTitle('Import')}</title></svelte:head>

<LayoutWithHeader
  fitViewport
  cssVariables={{
    '--max-layout-width': 'var(--max-layout-width-data-pages)',
    '--layout-background-color': 'var(--slate-50)',
    '--inset-page-section-padding': 'var(--size-xx-large)',
    '--page-padding': 'var(--outer-page-padding-for-inset-page)',
  }}
>
  <div class="import-preview-page">
    <div class="page-content">
      <InsetPageLayout>
        <h1 slot="header">Finish setting up your table</h1>
        <FieldLayout>
          <LabeledInput label="Table Name">
            <TextInput bind:value={tableName} />
          </LabeledInput>
        </FieldLayout>
        <FieldLayout>
          <ColumnNamingStrategyInput
            bind:value={firstRowIsHeader}
            on:change={updateDataFileHeader}
            disabled={formInputsAreDisabled}
          />
        </FieldLayout>
        <FieldLayout>
          <ColumnTypeInferenceInput
            bind:value={useColumnTypeInference}
            on:change={updateInference}
            disabled={formInputsAreDisabled}
          />
        </FieldLayout>
        <FieldLayout>
          <InfoBox>
            You can customize column names and types within the preview below.
          </InfoBox>
        </FieldLayout>
      </InsetPageLayout>

      <h2 class="large-bold-header preview-header">Table Preview</h2>
      <div class="preview-content">
        {#if !$previewRequest.hasInitialized}
          <div class="loading"><Spinner /></div>
        {:else if $previewRequest.settlement?.state === 'rejected'}
          <ErrorInfo
            error={$previewRequest.settlement.error}
            on:retry={() => init(tableId)}
            on:delete={handleCancel}
          />
        {:else if $headerUpdate.settlement?.state === 'rejected'}
          <ErrorInfo
            error={$headerUpdate.settlement.error}
            on:retry={updateDataFileHeader}
            on:delete={handleCancel}
          />
        {:else}
          <div class="sheet-holder">
            <ImportPreview
              columns={processedColumns}
              isLoading={$previewRequest.isLoading}
              {updateTypeRelatedOptions}
              {columnPropertiesMap}
              {records}
            />
          </div>
          {#if records.length === TRUNCATION_LIMIT}
            <div class="truncation-alert">
              (Preview is truncated at {TRUNCATION_LIMIT} rows.)
            </div>
          {/if}
        {/if}
      </div>
    </div>

    <div class="footer">
      <CancelOrProceedButtonPair
        onCancel={handleCancel}
        onProceed={finishImport}
        cancelButton={{ icon: iconDeleteMajor }}
        proceedButton={{ label: 'Confirm & create table' }}
        {canProceed}
      />
    </div>
  </div>
</LayoutWithHeader>

<style>
  .import-preview-page {
    display: grid;
    grid-template: 1fr auto / 1fr;
    height: 100%;
    --sheet-header-height: 5.25rem;
  }
  .page-content {
    overflow: auto;
  }
  .loading {
    text-align: center;
    font-size: 2rem;
    color: var(--slate-500);
  }
  .preview-header {
    margin: 0;
    padding: var(--size-small) var(--inset-page-section-padding);
    border-bottom: 1px solid var(--slate-200);
    border-top: solid 1px var(--slate-300);
    background: var(--white);
  }
  .preview-content {
    padding: var(--inset-page-section-padding);
  }
  .sheet-holder {
    max-width: fit-content;
    overflow: auto;
    margin: 0 auto;
    border: 1px solid var(--slate-200);
  }
  .footer {
    border-top: 1px solid var(--slate-200);
    padding: 1rem 1rem 1rem 1rem;
    background: var(--white);
  }
  .truncation-alert {
    margin: 1rem auto 0 auto;
    max-width: max-content;
    color: var(--color-text-muted);
  }
</style>
