<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { router } from 'tinro';

  import type { DataFile } from '@mathesar/api/rest/types/dataFiles';
  import { api } from '@mathesar/api/rpc';
  import type { Column } from '@mathesar/api/rpc/columns';
  import type { ColumnPreviewSpec, Table } from '@mathesar/api/rpc/tables';
  import {
    Field,
    FieldLayout,
    makeForm,
    requiredField,
    uniqueWith,
  } from '@mathesar/components/form';
  import InfoBox from '@mathesar/components/message-boxes/InfoBox.svelte';
  import { iconDeleteMajor } from '@mathesar/icons';
  import type { Database } from '@mathesar/models/Database';
  import type { Schema } from '@mathesar/models/Schema';
  import { runner } from '@mathesar/packages/json-rpc-client-builder';
  import {
    getImportPreviewPageUrl,
    getSchemaPageUrl,
    getTablePageUrl,
  } from '@mathesar/routes/urls';
  import { abstractTypesMap } from '@mathesar/stores/abstract-types';
  import AsyncStore from '@mathesar/stores/AsyncStore';
  import { currentDatabase } from '@mathesar/stores/databases';
  import {
    currentTables,
    deleteTable,
    updateTable,
  } from '@mathesar/stores/tables';
  import { toast } from '@mathesar/stores/toast';
  import {
    CancelOrProceedButtonPair,
    Spinner,
  } from '@mathesar-component-library';

  import ColumnNamingStrategyInput from '../column-names/ColumnNamingStrategyInput.svelte';
  import ColumnTypeInferenceInput from '../inference/ColumnTypeInferenceInput.svelte';

  import ErrorInfo from './ErrorInfo.svelte';
  import ImportPreviewLayout from './ImportPreviewLayout.svelte';
  import {
    buildColumnPropertiesMap,
    finalizeColumns,
    getSkeletonRecords,
    makeHeaderUpdateRequest,
    processColumns,
  } from './importPreviewPageUtils';
  import ImportPreviewSheet from './ImportPreviewSheet.svelte';

  /** Set via back-end */
  const TRUNCATION_LIMIT = 20;

  export let database: Database;
  export let schema: Schema;
  export let table: Table;
  export let dataFile: DataFile;
  export let useColumnTypeInference = false;

  let columns: Column[] = [];
  let columnPropertiesMap = buildColumnPropertiesMap([]);

  $: otherTableNames = $currentTables
    .filter((t) => t.oid !== table.oid)
    .map((t) => t.name);
  $: customizedTableName = requiredField(table.name, [
    uniqueWith(otherTableNames, $_('table_name_already_exists')),
  ]);
  $: form = makeForm({ customizedTableName });

  $: headerUpdateRequest = makeHeaderUpdateRequest({
    schema,
    table,
    dataFile,
  });
  $: cancelationRequest = new AsyncStore(() => deleteTable(schema, table.oid));
  $: typeSuggestionsRequest = new AsyncStore(() =>
    api.data_modeling
      .suggest_types({ table_oid: table.oid, database_id: database.id })
      .run(),
  );
  $: previewRequest = new AsyncStore(
    (columnPreviewSpecs: ColumnPreviewSpec[]) =>
      api.tables
        .get_import_preview({
          database_id: database.id,
          table_oid: table.oid,
          columns: columnPreviewSpecs,
        })
        .run(),
  );
  $: columnsFetch = new AsyncStore(runner(api.columns.list_with_metadata));

  $: records = $previewRequest.resolvedValue ?? getSkeletonRecords();
  $: formInputsAreDisabled = !$previewRequest.isOk;
  $: canProceed = $previewRequest.isOk && $form.canSubmit;
  $: processedColumns = processColumns(columns, abstractTypesMap);

  async function init() {
    const columnsResponse = await columnsFetch.run({
      database_id: $currentDatabase.id,
      table_oid: table.oid,
    });
    const fetchedColumns = columnsResponse?.resolvedValue;
    if (!fetchedColumns) {
      return;
    }
    columns = fetchedColumns;
    columnPropertiesMap = buildColumnPropertiesMap(columns);
    if (useColumnTypeInference) {
      const response = await typeSuggestionsRequest.run();
      if (response.settlement?.state === 'resolved') {
        const typeSuggestions = response.settlement.value;
        columns = columns.map((column) => ({
          ...column,
          type: typeSuggestions[column.id] ?? column.type,
        }));
      }
    }
    await previewRequest.run(columns);
  }
  $: table, useColumnTypeInference, void init();

  function reload(props: {
    table?: Pick<Table, 'oid'>;
    useColumnTypeInference?: boolean;
  }) {
    const tableId = props.table?.oid ?? table.oid;
    router.goto(
      getImportPreviewPageUrl(database.id, schema.oid, tableId, {
        useColumnTypeInference:
          props.useColumnTypeInference ?? useColumnTypeInference,
      }),
      true,
    );
  }

  async function toggleHeader() {
    previewRequest.reset();
    const response = await headerUpdateRequest.run({
      firstRowIsHeader: !dataFile.header,
      customizedTableName: $customizedTableName,
    });
    if (response.resolvedValue) {
      reload({ table: response.resolvedValue, useColumnTypeInference });
    }
  }

  async function toggleInference() {
    previewRequest.reset();
    reload({ useColumnTypeInference: !useColumnTypeInference });
  }

  function updateTypeRelatedOptions(updatedColumn: Column) {
    columns = columns.map((c) =>
      c.id === updatedColumn.id ? updatedColumn : c,
    );
    return previewRequest.run(columns);
  }

  async function cancel() {
    const response = await cancelationRequest.run();
    if (response.isOk) {
      router.goto(getSchemaPageUrl(database.id, schema.oid), true);
    } else {
      toast.fromError(response.error);
    }
  }

  async function finishImport() {
    try {
      await updateTable({
        database,
        table: {
          oid: table.oid,
          name: $customizedTableName,
          metadata: {
            import_verified: true,
          },
        },
        columnPatchSpecs: finalizeColumns(columns, columnPropertiesMap),
        columnsToDelete: Object.entries(columnPropertiesMap)
          .filter(([, { selected }]) => !selected)
          .map(([id]) => parseInt(id, 10)),
      });
      router.goto(getTablePageUrl(database.id, schema.oid, table.oid), true);
    } catch (err) {
      toast.fromError(err);
    }
  }
</script>

<ImportPreviewLayout>
  <Field field={customizedTableName} label={$_('table_name')} />
  <FieldLayout>
    <ColumnNamingStrategyInput
      value={dataFile.header}
      on:change={toggleHeader}
      disabled={formInputsAreDisabled}
    />
  </FieldLayout>
  <FieldLayout>
    <ColumnTypeInferenceInput
      value={useColumnTypeInference}
      on:change={toggleInference}
      disabled={formInputsAreDisabled}
    />
  </FieldLayout>
  <FieldLayout>
    <InfoBox>
      {$_('customize_names_types_preview')}
    </InfoBox>
  </FieldLayout>

  <svelte:fragment slot="preview">
    <h2 class="large-bold-header preview-header">
      {$_('table_preview')}
    </h2>
    <div class="preview-content">
      {#if $columnsFetch.error}
        <ErrorInfo
          error={$columnsFetch.error}
          on:retry={init}
          on:delete={cancel}
        />
      {:else if !$previewRequest.hasInitialized}
        <div class="loading"><Spinner /></div>
      {:else if $previewRequest.error}
        <ErrorInfo
          error={$previewRequest.error}
          on:retry={init}
          on:delete={cancel}
        />
      {:else if $headerUpdateRequest.error}
        <ErrorInfo
          error={$headerUpdateRequest.error}
          on:retry={init}
          on:delete={cancel}
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
            ({$_('preview_truncated_at_limit', {
              values: {
                limit: TRUNCATION_LIMIT,
              },
            })})
          </div>
        {/if}
      {/if}
    </div>
  </svelte:fragment>

  <svelte:fragment slot="footer">
    {#if $cancelationRequest.isLoading}
      {$_('cleaning_up')}... <Spinner />
    {:else}
      <CancelOrProceedButtonPair
        onCancel={cancel}
        onProceed={finishImport}
        cancelButton={{ icon: iconDeleteMajor }}
        proceedButton={{ label: $_('confirm_and_create_table') }}
        {canProceed}
      />
    {/if}
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
    overflow-x: auto;
    overflow-y: hidden;
    margin: 0 auto;
    border: 1px solid var(--slate-200);
  }
  .truncation-alert {
    margin: 1rem auto 0 auto;
    max-width: max-content;
    color: var(--color-text-muted);
  }
</style>
