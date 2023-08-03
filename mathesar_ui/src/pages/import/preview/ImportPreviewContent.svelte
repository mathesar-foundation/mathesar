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
  import type { DataFile } from '@mathesar/api/types/dataFiles';
  import type { TableEntry } from '@mathesar/api/types/tables';
  import type { Column } from '@mathesar/api/types/tables/columns';
  import { FieldLayout } from '@mathesar/components/form';
  import InfoBox from '@mathesar/components/message-boxes/InfoBox.svelte';
  import { iconDeleteMajor } from '@mathesar/icons';
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
    getTypeSuggestionsForTable,
    patchTable,
  } from '@mathesar/stores/tables';
  import { toast } from '@mathesar/stores/toast';
  import ColumnNamingStrategyInput from '../column-names/ColumnNamingStrategyInput.svelte';
  import ColumnTypeInferenceInput from '../inference/ColumnTypeInferenceInput.svelte';
  import ErrorInfo from './ErrorInfo.svelte';
  import ImportPreviewLayout from './ImportPreviewLayout.svelte';
  import ImportPreviewSheet from './ImportPreviewSheet.svelte';
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
  const previewRequest = new AsyncStore(generateTablePreview);
  const typeSuggestionsRequest = new AsyncStore(getTypeSuggestionsForTable);
  const headerUpdate = makeHeaderUpdateRequest();

  export let database: Database;
  export let schema: SchemaEntry;
  export let table: TableEntry;
  export let dataFile: DataFile;
  export let useColumnTypeInference = false;

  let customizedTableName = '';
  let columns: Column[] = [];
  let columnPropertiesMap = buildColumnPropertiesMap([]);

  $: records =
    $previewRequest.settlement?.state === 'resolved'
      ? $previewRequest.settlement.value.records
      : getSkeletonRecords();
  $: formInputsAreDisabled = !$previewRequest.isOk || $headerUpdate.isLoading;
  $: canProceed = $previewRequest.isOk && $headerUpdate.isStable;
  $: processedColumns = processColumns(columns, $currentDbAbstractTypes.data);
  $: url = getImportPreviewPageUrl(database.name, schema.id, table.id, {
    useColumnTypeInference,
  });
  $: router.goto(url, true);

  async function init() {
    // TODO: don't re-run this when the user changes `useColumnTypeInference`
    customizedTableName = table.name;

    const columnData = await columnsFetch.run(table.id);
    columns = columnData.resolvedValue?.results ?? [];
    columnPropertiesMap = buildColumnPropertiesMap(columns);

    if (useColumnTypeInference) {
      const response = await typeSuggestionsRequest.run(table.id);
      if (response.settlement?.state === 'resolved') {
        const typeSuggestions = response.settlement.value;
        columns = columns.map((column) => ({
          ...column,
          type: typeSuggestions[column.name] ?? column.type,
        }));
      }
    }

    await previewRequest.run({ table, columns });
  }

  $: table, useColumnTypeInference, void init();

  async function toggleHeader() {
    void headerUpdate.run({
      database,
      dataFile,
      firstRowIsHeader: !dataFile.header,
      schema,
      table,
      customizedTableName,
    });
  }

  async function toggleInference() {
    // TODO
  }

  function updateTypeRelatedOptions(updatedColumn: Column) {
    columns = columns.map((c) =>
      c.id === updatedColumn.id ? updatedColumn : c,
    );
    return previewRequest.run({ table, columns });
  }

  function handleCancel() {
    // TODO wrap in an AsyncStore
    void deleteTable(database, schema, table.id).catch((err) => {
      const errorMessage =
        err instanceof Error ? err.message : 'Unable to cancel import';
      toast.error(errorMessage);
    });
    router.goto(getSchemaPageUrl(database.name, schema.id), true);
  }

  async function finishImport() {
    try {
      await patchTable(table.id, {
        name: customizedTableName,
        import_verified: true,
        columns: finalizeColumns(columns, columnPropertiesMap),
      });
      router.goto(getTablePageUrl(database.name, schema.id, table.id), true);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unable to save table';
      toast.error(errorMessage);
    }
  }
</script>

<ImportPreviewLayout>
  <FieldLayout>
    <LabeledInput label="Table Name">
      <TextInput bind:value={customizedTableName} />
    </LabeledInput>
  </FieldLayout>
  <FieldLayout>
    <ColumnNamingStrategyInput
      value={dataFile.header}
      on:change={toggleHeader}
      disabled={formInputsAreDisabled}
    />
  </FieldLayout>
  <FieldLayout>
    <ColumnTypeInferenceInput
      bind:value={useColumnTypeInference}
      on:change={toggleInference}
      disabled={formInputsAreDisabled}
    />
  </FieldLayout>
  <FieldLayout>
    <InfoBox>
      You can customize column names and types within the preview below.
    </InfoBox>
  </FieldLayout>

  <svelte:fragment slot="preview">
    <h2 class="large-bold-header preview-header">Table Preview</h2>
    <div class="preview-content">
      {#if !$previewRequest.hasInitialized}
        <div class="loading"><Spinner /></div>
      {:else if $previewRequest.settlement?.state === 'rejected'}
        <ErrorInfo
          error={$previewRequest.settlement.error}
          on:retry={() => init()}
          on:delete={handleCancel}
        />
      {:else if $headerUpdate.settlement?.state === 'rejected'}
        <ErrorInfo
          error={$headerUpdate.settlement.error}
          on:retry={() => init()}
          on:delete={handleCancel}
        />
      {:else}
        <div class="sheet-holder">
          <ImportPreviewSheet
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
  </svelte:fragment>

  <svelte:fragment slot="footer">
    <CancelOrProceedButtonPair
      onCancel={handleCancel}
      onProceed={finishImport}
      cancelButton={{ icon: iconDeleteMajor }}
      proceedButton={{ label: 'Confirm & create table' }}
      {canProceed}
    />
  </svelte:fragment>
</ImportPreviewLayout>

<style>
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
  .truncation-alert {
    margin: 1rem auto 0 auto;
    max-width: max-content;
    color: var(--color-text-muted);
  }
</style>
