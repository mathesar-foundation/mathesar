<script lang="ts">
  import { tick } from 'svelte';
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
  import type { RequestStatus } from '@mathesar/api/utils/requestUtils';
  import CellFabric from '@mathesar/components/cell-fabric/CellFabric.svelte';
  import { FieldLayout } from '@mathesar/components/form';
  import InfoBox from '@mathesar/components/message-boxes/InfoBox.svelte';
  import {
    Sheet,
    SheetCell,
    SheetCellResizer,
    SheetHeader,
    SheetRow,
  } from '@mathesar/components/sheet';
  import { iconDeleteMajor } from '@mathesar/icons';
  import InsetPageLayout from '@mathesar/layouts/InsetPageLayout.svelte';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import {
    getImportPreviewPageUrl,
    getSchemaPageUrl,
    getTablePageUrl,
  } from '@mathesar/routes/urls';
  import { currentDbAbstractTypes } from '@mathesar/stores/abstract-types';
  import {
    createTable,
    deleteTable,
    generateTablePreview,
    getTableFromStoreOrApi,
    getTypeSuggestionsForTable,
    patchTable,
  } from '@mathesar/stores/tables';
  import { toast } from '@mathesar/stores/toast';
  import { getErrorMessage } from '@mathesar/utils/errors';
  import ColumnNamingStrategyInput from '../column-names/ColumnNamingStrategyInput.svelte';
  import ColumnTypeInferenceInput from '../inference/ColumnTypeInferenceInput.svelte';
  import ErrorInfo from './ErrorInfo.svelte';
  import PreviewColumn from './PreviewColumn.svelte';
  import {
    getSkeletonRecords,
    processColumns,
    type ColumnProperties,
  } from './importPreviewPageUtils';

  /** Set via back-end */
  const TRUNCATION_LIMIT = 20;

  export let database: Database;
  export let schema: SchemaEntry;
  export let tableId: number;
  export let useColumnTypeInference = false;
  export let firstRowIsHeader = false;

  let previewRequestStatus: RequestStatus;
  let headerUpdateRequestStatus: RequestStatus;
  let typeChangeRequestStatus: RequestStatus;
  let tableName = '';
  let tableInfo: TableEntry;
  let dataFileDetails: { id: number; header: boolean };
  let columns: Column[] = [];
  let records = getSkeletonRecords();
  let columnPropertiesMap: Record<Column['id'], ColumnProperties> = {};

  let previewTableLoadRequest:
    | ReturnType<typeof generateTablePreview>
    | undefined;
  let columnsFetchRequest: ReturnType<typeof columnsApi.list> | undefined;
  let dataFileFetchRequest: ReturnType<typeof dataFilesApi.get> | undefined;
  let typeSuggestionRequest:
    | ReturnType<typeof getTypeSuggestionsForTable>
    | undefined;

  $: isLoading =
    previewRequestStatus?.state === 'processing' ||
    headerUpdateRequestStatus?.state === 'processing';
  $: showTableSkeleton =
    isLoading || typeChangeRequestStatus?.state === 'processing';
  $: canProceed =
    !isLoading &&
    !showTableSkeleton &&
    previewRequestStatus?.state !== 'failure' &&
    headerUpdateRequestStatus?.state !== 'failure';
  $: processedColumns = processColumns(columns, $currentDbAbstractTypes.data);

  async function loadTablePreview(_columns: Column[]) {
    previewTableLoadRequest?.cancel();
    previewTableLoadRequest = generateTablePreview(tableId, _columns);
    records = (await previewTableLoadRequest).records;
  }

  async function fetchTableInfo() {
    if (tableId !== tableInfo?.id) {
      tableInfo = await getTableFromStoreOrApi(tableId);
      tableName = tableInfo.name;
    }
    columnsFetchRequest?.cancel();
    columnsFetchRequest = columnsApi.list(tableId);
    const columnData = await columnsFetchRequest;
    columns = columnData.results;
    columnPropertiesMap = columns.reduce(
      (_columnProperties, column) => ({
        ..._columnProperties,
        [column.id]: {
          selected: true,
          displayName: column.name,
        },
      }),
      {},
    );
    return tableInfo;
  }

  async function fetchDataFileDetails(_dataFileId: number) {
    if (_dataFileId !== dataFileDetails?.id) {
      dataFileFetchRequest?.cancel();
      dataFileFetchRequest = dataFilesApi.get(_dataFileId);
      dataFileDetails = await dataFileFetchRequest;
    }
    firstRowIsHeader = dataFileDetails.header;
    return dataFileDetails;
  }

  /**
   * Preview table id will change,
   * 1. whenever user redirects to a different preview
   * 2. whenever user toggles first row as header checkbox
   */
  async function onPreviewTableIdChange(_tableId: number) {
    try {
      /**
       * Since this method is async and is called reactively on the component,
       * the prop updates in this method would only occur when it finishes
       * execution. Hence, it is essential to await a tick to ensure that
       * prop updates happen during method execution.
       */
      await tick();
      previewRequestStatus = { state: 'processing' };

      if (useColumnTypeInference) {
        typeSuggestionRequest?.cancel();
        typeSuggestionRequest = getTypeSuggestionsForTable(_tableId);
      }
      const table = await fetchTableInfo();

      if (table.import_verified || !table.data_files?.length) {
        router.goto(getTablePageUrl(database.name, schema.id, table.id));
        return;
      }

      const dataFileDetailsPromise = fetchDataFileDetails(table.data_files[0]);

      if (useColumnTypeInference && typeSuggestionRequest) {
        const typeSuggestions = await typeSuggestionRequest;
        columns = columns.map((column) => ({
          ...column,
          type: typeSuggestions[column.name] ?? column.type,
        }));
      }

      const previewPromise = loadTablePreview(columns);
      await Promise.all([dataFileDetailsPromise, previewPromise]);
      previewRequestStatus = { state: 'success' };
    } catch (err) {
      previewRequestStatus = {
        state: 'failure',
        errors: [
          err instanceof Error
            ? err.message
            : 'An error occurred while loading the preview.',
        ],
      };
    }
  }

  $: void onPreviewTableIdChange(tableId);

  async function updateDataFileHeader() {
    if (dataFileDetails) {
      try {
        headerUpdateRequestStatus = { state: 'processing' };
        dataFileDetails.header = firstRowIsHeader;
        await Promise.all([
          deleteTable(database, schema, tableId),
          dataFilesApi.update(dataFileDetails.id, {
            header: firstRowIsHeader,
          }),
        ]);
        tableInfo = await createTable(database, schema, {
          name: tableName,
          dataFiles: [dataFileDetails.id],
        });
        headerUpdateRequestStatus = { state: 'success' };
        const newUrl = getImportPreviewPageUrl(
          database.name,
          schema.id,
          tableInfo.id,
          { useColumnTypeInference, firstRowIsHeader },
        );
        router.goto(newUrl, true);
      } catch (err) {
        headerUpdateRequestStatus = {
          state: 'failure',
          errors: [getErrorMessage(err)],
        };
      }
    }
  }

  async function updateInference() {
    // TODO
  }

  async function updateTypeRelatedOptions(updatedColumn: Column) {
    try {
      typeChangeRequestStatus = { state: 'processing' };
      const newColumns = columns.map((column) => {
        if (column.id === updatedColumn.id) {
          return updatedColumn;
        }
        return column;
      });
      await loadTablePreview(newColumns);
      columns = newColumns;
      typeChangeRequestStatus = { state: 'success' };
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? `Data Type Change Failed: ${getErrorMessage(err.message)}`
          : 'Data Type Change Failed';
      typeChangeRequestStatus = {
        state: 'failure',
        errors: [errorMessage],
      };
      throw new Error(errorMessage);
    }
  }

  function handleCancel() {
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
        columns: columns
          .filter((column) => columnPropertiesMap[column.id]?.selected)
          .map((column) => ({
            id: column.id,
            name: columnPropertiesMap[column.id].displayName,
            type: column.type,
            type_options: column.type_options,
            display_options: column.display_options,
          })),
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
            disabled={isLoading}
          />
        </FieldLayout>
        <FieldLayout>
          <ColumnTypeInferenceInput
            bind:value={useColumnTypeInference}
            on:change={updateInference}
            disabled={isLoading}
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
        {#if isLoading}
          <div class="loading"><Spinner /></div>
        {:else if previewRequestStatus?.state === 'failure'}
          <ErrorInfo
            errors={previewRequestStatus.errors}
            on:retry={() => onPreviewTableIdChange(tableId)}
            on:delete={handleCancel}
          />
        {:else if headerUpdateRequestStatus?.state === 'failure'}
          <ErrorInfo
            errors={headerUpdateRequestStatus.errors}
            on:retry={updateDataFileHeader}
            on:delete={handleCancel}
          />
        {:else}
          <div class="sheet-holder">
            <Sheet
              restrictWidthToRowWidth
              columns={processedColumns}
              getColumnIdentifier={(c) => c.id}
            >
              <SheetHeader inheritFontStyle>
                {#each processedColumns as processedColumn (processedColumn.id)}
                  <SheetCell
                    columnIdentifierKey={processedColumn.id}
                    let:htmlAttributes
                    let:style
                  >
                    <div {...htmlAttributes} {style}>
                      <PreviewColumn
                        {isLoading}
                        {processedColumn}
                        {updateTypeRelatedOptions}
                        bind:selected={columnPropertiesMap[processedColumn.id]
                          .selected}
                        bind:displayName={columnPropertiesMap[
                          processedColumn.id
                        ].displayName}
                      />
                      <SheetCellResizer
                        columnIdentifierKey={processedColumn.id}
                        minColumnWidth={120}
                      />
                    </div>
                  </SheetCell>
                {/each}
              </SheetHeader>
              {#each records as record (record)}
                <SheetRow
                  style={{ position: 'relative', height: 30 }}
                  let:htmlAttributes
                  let:styleString
                >
                  <div {...htmlAttributes} style={styleString}>
                    {#each processedColumns as processedColumn (processedColumn)}
                      <SheetCell
                        columnIdentifierKey={processedColumn.id}
                        let:htmlAttributes
                        let:style
                      >
                        <div {...htmlAttributes} {style}>
                          <CellFabric
                            columnFabric={processedColumn}
                            value={record[processedColumn.column.name]}
                            showAsSkeleton={showTableSkeleton}
                            disabled={true}
                          />
                        </div>
                      </SheetCell>
                    {/each}
                  </div>
                </SheetRow>
              {/each}
            </Sheet>
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
  :global(.sheet [data-sheet-element='header']) {
    background: var(--slate-100);
  }
  :global(.sheet [data-sheet-element='cell']) {
    background: var(--white);
  }
  :global(.sheet [data-sheet-element] [data-sheet-element='cell']:last-child) {
    border-right: none;
  }
  :global(.sheet
      [data-sheet-element='row']:last-child
      [data-sheet-element='cell']) {
    border-bottom: none;
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
