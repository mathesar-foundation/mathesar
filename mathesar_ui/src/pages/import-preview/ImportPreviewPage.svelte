<script lang="ts">
  import { tick } from 'svelte';
  import { router } from 'tinro';
  import {
    getImportPreviewPageUrl,
    getTablePageUrl,
    getSchemaPageUrl,
  } from '@mathesar/routes/urls';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import {
    Sheet,
    SheetHeader,
    SheetCell,
    SheetCellResizer,
    SheetRow,
  } from '@mathesar/components/sheet';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import {
    Checkbox,
    LabeledInput,
    TextInput,
    Spinner,
    CancelOrProceedButtonPair,
    CancellablePromise,
  } from '@mathesar-component-library';
  import type { TableEntry } from '@mathesar/api/tables';
  import type { Column } from '@mathesar/api/tables/columns';
  import { getAPI, patchAPI } from '@mathesar/utils/api';
  import type { RequestStatus, PaginatedResponse } from '@mathesar/utils/api';
  import {
    getTableFromStoreOrApi,
    getTypeSuggestionsForTable,
    generateTablePreview,
    patchTable,
    deleteTable,
    createTable,
  } from '@mathesar/stores/tables';
  import {
    currentDbAbstractTypes,
    getAbstractTypeForDbType,
  } from '@mathesar/stores/abstract-types';
  import type { AbstractTypesMap } from '@mathesar/stores/abstract-types/types';
  import CellFabric from '@mathesar/components/cell-fabric/CellFabric.svelte';
  import { iconDelete } from '@mathesar/icons';
  import { getCellCap } from '@mathesar/components/cell-fabric/utils';
  import { toast } from '@mathesar/stores/toast';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import PreviewColumn from './PreviewColumn.svelte';

  export let database: Database;
  export let schema: SchemaEntry;
  export let previewTableId: number;

  let tableIsAlreadyConfirmed = false;

  let previewRequestStatus: RequestStatus;
  let headerUpdateRequestStatus: RequestStatus;
  let typeChangeRequestStatus: RequestStatus;
  let tableName = '';
  let useFirstRowAsHeader = true;

  let tableInfo: TableEntry;
  let dataFileDetails: { id: number; header: boolean };
  let columns: Column[] = [];
  // Add a couple empty records to show skeleton upon initial load
  let records: Record<string, unknown>[] = [{}, {}];

  $: isLoading =
    previewRequestStatus?.state === 'processing' ||
    headerUpdateRequestStatus?.state === 'processing';
  $: showTableSkeleton =
    isLoading || typeChangeRequestStatus?.state === 'processing';
  $: canProceed =
    !showTableSkeleton &&
    previewRequestStatus?.state !== 'failure' &&
    headerUpdateRequestStatus?.state !== 'failure';

  let columnProperties: Record<
    Column['id'],
    { selected: boolean; displayName: string }
  > = {};

  const promises: {
    previewTableLoadPromise?: CancellablePromise<{
      records: Record<string, unknown>[];
    }>;
    columnsFetchPromise?: CancellablePromise<PaginatedResponse<Column>>;
    dataFileFetchPromise?: CancellablePromise<{ id: number; header: boolean }>;
    typeSuggestionPromise?: ReturnType<typeof getTypeSuggestionsForTable>;
  } = {};

  function processColumns(
    _columns: Column[],
    abstractTypeMap: AbstractTypesMap,
  ) {
    return _columns.map((column) => {
      const abstractType = getAbstractTypeForDbType(
        column.type,
        abstractTypeMap,
      );
      return {
        id: column.id,
        column,
        abstractType,
        cellComponentAndProps: getCellCap(abstractType.cell, column),
      };
    });
  }

  $: processedColumns = processColumns(columns, $currentDbAbstractTypes.data);

  async function loadTablePreview(_columns: Column[]) {
    promises.previewTableLoadPromise?.cancel();
    promises.previewTableLoadPromise = generateTablePreview(
      previewTableId,
      _columns.map((column) => ({
        id: column.id,
        name: column.name,
        type: column.type,
        type_options: column.type_options,
        display_options: column.display_options,
      })),
    );
    const response = await promises.previewTableLoadPromise;
    records = response.records;
  }

  async function fetchTableInfo() {
    if (previewTableId !== tableInfo?.id) {
      tableInfo = await getTableFromStoreOrApi(previewTableId);
      tableName = tableInfo.name;
    }
    // TODO: Move this request to /api
    // Get `valid_target_types` in Table response
    promises.columnsFetchPromise?.cancel();
    promises.columnsFetchPromise = getAPI<PaginatedResponse<Column>>(
      `/api/db/v0/tables/${previewTableId}/columns/?limit=500`,
    );
    const columnData = await promises.columnsFetchPromise;
    columns = columnData.results;
    columnProperties = columns.reduce(
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
      promises.dataFileFetchPromise?.cancel();
      promises.dataFileFetchPromise = getAPI<{ id: number; header: boolean }>(
        `/api/db/v0/data_files/${_dataFileId}/`,
      );
      dataFileDetails = await promises.dataFileFetchPromise;
    }
    useFirstRowAsHeader = dataFileDetails.header;
    return dataFileDetails;
  }

  /**
   * Preview table id will change,
   * 1. whenever user redirects to a different preview
   * 2. whenever user toggles first row as header checkbox
   */
  async function onPreviewTableIdChange(_previewTableId: number) {
    try {
      /**
       * Since this method is async and is called reactively on the component,
       * the prop updates in this method would only occur when it finishes
       * execution. Hence, it is essential to await a tick to ensure that
       * prop updates happen during method execution.
       */
      await tick();
      previewRequestStatus = { state: 'processing' };
      promises.typeSuggestionPromise?.cancel();
      promises.typeSuggestionPromise =
        getTypeSuggestionsForTable(_previewTableId);
      const tableDetails = await fetchTableInfo();

      if (tableDetails.import_verified || !tableDetails.data_files?.length) {
        // Do not allow preview since table is already verified
        // Show 404 or error message here
        tableIsAlreadyConfirmed = true;
        return;
      }

      tableIsAlreadyConfirmed = false;

      const dataFileDetailsPromise = fetchDataFileDetails(
        tableDetails.data_files[0],
      );
      const typeSuggestions = await promises.typeSuggestionPromise;
      columns = columns.map((column) => ({
        ...column,
        type: typeSuggestions[column.name] ?? column.type,
      }));

      const previewPromise = loadTablePreview(columns);
      await Promise.all([dataFileDetailsPromise, previewPromise]);
      previewRequestStatus = { state: 'success' };
    } catch (err) {
      previewRequestStatus = {
        state: 'failure',
        errors: [err instanceof Error ? err.message : 'Unable to load preview'],
      };
    }
  }

  $: void onPreviewTableIdChange(previewTableId);

  async function updateDataFileHeader() {
    if (dataFileDetails) {
      try {
        headerUpdateRequestStatus = { state: 'processing' };
        dataFileDetails.header = useFirstRowAsHeader;
        const deleteTablePromise = deleteTable(previewTableId);
        const patchDataFilePromise = patchAPI(
          `/api/db/v0/data_files/${dataFileDetails.id}/`,
          {
            header: useFirstRowAsHeader,
          },
        );
        await Promise.all([deleteTablePromise, patchDataFilePromise]);
        tableInfo = await createTable(schema.id, {
          name: tableName,
          dataFiles: [dataFileDetails.id],
        });
        headerUpdateRequestStatus = { state: 'success' };
        router.goto(
          getImportPreviewPageUrl(database.name, schema.id, tableInfo.id),
          true,
        );
      } catch (err) {
        headerUpdateRequestStatus = {
          state: 'failure',
          errors: [
            err instanceof Error ? err.message : 'Unable to load preview',
          ],
        };
      }
    }
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
      typeChangeRequestStatus = {
        state: 'failure',
        errors: [err instanceof Error ? err.message : 'Unable to change type'],
      };
      throw err;
    }
  }

  function handleCancel() {
    void deleteTable(previewTableId).catch((err) => {
      const errorMessage =
        err instanceof Error ? err.message : 'Unable to cancel import';
      toast.error(errorMessage);
    });
    router.goto(getSchemaPageUrl(database.name, schema.id), true);
  }

  async function finishImport() {
    try {
      await patchTable(previewTableId, {
        name: tableName,
        import_verified: true,
        columns: columns
          .filter((column) => columnProperties[column.id]?.selected)
          .map((column) => ({
            id: column.id,
            name: columnProperties[column.id].displayName,
            type: column.type,
            type_options: column.type_options,
            display_options: column.display_options,
          })),
      });
      router.goto(
        getTablePageUrl(database.name, schema.id, previewTableId),
        true,
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unable to save table';
      toast.error(errorMessage);
    }
  }
</script>

<svelte:head><title>{makeSimplePageTitle('Import')}</title></svelte:head>

<LayoutWithHeader>
  <div class="table-preview-confirmation">
    <h2>Confirm your data</h2>

    <div class="help-content">
      To finish, review suggestions for the field types and column names. To
      ensure your import is correct we have included a preview of your first few
      rows.
    </div>

    {#if tableIsAlreadyConfirmed}
      Table has already been confirmed. Click here to view the table.
    {:else}
      <div class="table-properties-inputs">
        <LabeledInput label="Enter table name:" layout="inline">
          <TextInput bind:value={tableName} />
        </LabeledInput>

        <LabeledInput
          label="Use first row as header"
          layout="inline-input-first"
        >
          <Checkbox
            bind:checked={useFirstRowAsHeader}
            disabled={isLoading}
            on:change={updateDataFileHeader}
          />
        </LabeledInput>
      </div>

      <div class="help-content preview-message">
        {#if isLoading}
          Please wait until we prepare a preview for you <Spinner />
        {:else if previewRequestStatus?.state === 'failure'}
          {previewRequestStatus.errors.join(',')}
        {:else if headerUpdateRequestStatus?.state === 'failure'}
          {headerUpdateRequestStatus.errors.join(',')}
        {/if}
      </div>

      <div class="table-preview-content">
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
                    bind:selected={columnProperties[processedColumn.id]
                      .selected}
                    bind:displayName={columnProperties[processedColumn.id]
                      .displayName}
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
              style={{
                position: 'relative',
                height: 30,
              }}
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

      <div class="footer">
        {#if !isLoading}
          <CancelOrProceedButtonPair
            onCancel={handleCancel}
            onProceed={finishImport}
            cancelButton={{ icon: iconDelete }}
            proceedButton={{ label: 'Confirm & create table' }}
            {canProceed}
          />
        {/if}
      </div>
    {/if}
  </div>
</LayoutWithHeader>

<style lang="scss">
  .table-preview-confirmation {
    --sheet-header-height: 5.25rem;
    margin-top: 1rem;

    > *:not(.table-preview-content) {
      max-width: 900px;
      margin-left: auto;
      margin-right: auto;
    }

    .table-properties-inputs {
      margin: 1rem auto;
      > :global(.labeled-input) {
        margin-bottom: 1rem;
      }
    }

    .help-content {
      line-height: 1.6;

      &.preview-message {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
    }

    .table-preview-content {
      margin-top: 1rem;
      border-radius: 0.2rem;

      > :global(.sheet) {
        margin-left: auto;
        margin-right: auto;
        border-top: 1px solid var(--color-gray-light);
        border-left: 1px solid var(--color-gray-light);
        // TODO: This should be min of (100%, 900px)
        min-width: 900px;
      }
    }

    .footer {
      margin: 1.6rem auto;
    }
  }
</style>
