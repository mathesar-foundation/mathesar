<script lang="ts">
  import { router } from 'tinro';
  import { getImportPreviewPageUrl } from '@mathesar/routes/urls';
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
  } from '@mathesar-component-library';
  import type { TableEntry } from '@mathesar/api/tables';
  import type { Column } from '@mathesar/api/tables/columns';
  import { getAPI, patchAPI } from '@mathesar/utils/api';
  import type { RequestStatus, PaginatedResponse } from '@mathesar/utils/api';
  import {
    getTable,
    getTypeSuggestionsForTable,
    generateTablePreview,
    deleteTable,
    createTable,
  } from '@mathesar/stores/tables';
  import {
    currentDbAbstractTypes,
    getAbstractTypeForDbType,
  } from '@mathesar/stores/abstract-types';
  import type { AbstractTypesMap } from '@mathesar/stores/abstract-types/types';
  import CellFabric from '@mathesar/components/cell-fabric/CellFabric.svelte';
  import { getCellCap } from '@mathesar/components/cell-fabric/utils';
  import PreviewColumn from './PreviewColumn.svelte';

  export let database: Database;
  export let schema: SchemaEntry;
  export let previewTableId: number;

  let tableIsAlreadyConfirmed = false;

  let previewRequestStatus: RequestStatus;
  let tableName = '';
  let useFirstRowAsHeader = true;

  let tableInfo: TableEntry;
  let dataFileDetails: { id: number; header: boolean };
  let columns: Column[] = [];
  let records: Record<string, unknown>[] = [];

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

  async function loadTablePreview() {
    previewRequestStatus = { state: 'processing' };
    try {
      const response = await generateTablePreview(
        previewTableId,
        columns.map((column) => ({
          id: column.id,
          name: column.name,
          type: column.type,
        })),
      );
      records = response.records;
      previewRequestStatus = { state: 'success' };
    } catch (err) {
      previewRequestStatus = {
        state: 'failure',
        errors: [err instanceof Error ? err.message : 'Unable to load preview'],
      };
    }
  }

  async function fetchTableInfo() {
    if (previewTableId !== tableInfo?.id) {
      tableInfo = await getTable(previewTableId);
      tableName = tableInfo.name;
    }
    // TODO: Move this request to /api
    // Get `valid_target_types` in Table response
    const columnData = await getAPI<PaginatedResponse<Column>>(
      `/api/db/v0/tables/${previewTableId}/columns/?limit=500`,
    );
    columns = columnData.results;
    return tableInfo;
  }

  async function fetchDataFileDetails(_dataFileId: number) {
    if (_dataFileId !== dataFileDetails?.id) {
      dataFileDetails = await getAPI<{ id: number; header: boolean }>(
        `/api/db/v0/data_files/${_dataFileId}/`,
      );
    }
    useFirstRowAsHeader = dataFileDetails.header;
    return dataFileDetails;
  }

  async function onPreviewTableIdChange(_previewTableId: number) {
    const typeSuggestionPromise = getTypeSuggestionsForTable(_previewTableId);
    const tableDetails = await fetchTableInfo();

    if (tableDetails.import_verified || !tableDetails.data_files?.length) {
      // Cannot preview
      // Show 404 or error message here
      tableIsAlreadyConfirmed = true;
      return;
    }

    tableIsAlreadyConfirmed = false;

    const dataFileDetailsPromise = fetchDataFileDetails(
      tableDetails.data_files[0],
    );
    const typeSuggestions = await typeSuggestionPromise;
    columns = columns.map((column) => ({
      ...column,
      type: typeSuggestions[column.name] ?? column.type,
    }));

    const previewPromise = loadTablePreview();
    await Promise.all([dataFileDetailsPromise, previewPromise]);
  }

  $: void onPreviewTableIdChange(previewTableId);

  async function updateDataFileHeader() {
    if (dataFileDetails) {
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
      router.goto(
        getImportPreviewPageUrl(database.name, schema.id, tableInfo.id),
      );
    }
  }
</script>

<LayoutWithHeader>
  <h2>Confirm your data</h2>

  <div class="help-content">
    {#if previewRequestStatus?.state === 'processing'}
      Please wait until we prepare a preview
    {:else if previewRequestStatus?.state === 'failure'}
      {previewRequestStatus.errors.join(',')}
    {:else}
      To finish, review suggestions for the field types and column names. To
      ensure your import is correct we have included a preview of your first few
      rows.
    {/if}
  </div>

  {#if tableIsAlreadyConfirmed}
    Table has already been confirmed. Click here to view the table.
  {:else}
    <div class="table-preview-configurations">
      <div class="name">
        Table name: <TextInput bind:value={tableName} />
      </div>

      <LabeledInput label="Use first row as header" layout="inline-input-first">
        <Checkbox
          bind:checked={useFirstRowAsHeader}
          disabled={previewRequestStatus?.state === 'processing'}
          on:change={updateDataFileHeader}
        />
      </LabeledInput>

      <div class="table-preview-content">
        <Sheet columns={processedColumns} getColumnIdentifier={(c) => c.id}>
          <SheetHeader>
            {#each processedColumns as processedColumn (processedColumn.id)}
              <SheetCell
                columnIdentifierKey={processedColumn.id}
                let:htmlAttributes
                let:style
              >
                <div {...htmlAttributes} {style} class="inherit-font-style">
                  <PreviewColumn {processedColumn} />
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
                {#each processedColumns as processedColumn (processedColumn.id)}
                  <SheetCell
                    columnIdentifierKey={processedColumn.id}
                    let:htmlAttributes
                    let:style
                  >
                    <div {...htmlAttributes} {style}>
                      <CellFabric
                        columnFabric={processedColumn}
                        value={record[processedColumn.column.name]}
                        showAsSkeleton={previewRequestStatus?.state ===
                          'processing'}
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
    </div>
  {/if}
</LayoutWithHeader>

<style lang="scss">
  .table-preview-configurations {
    --sheet-header-height: 64px;

    .table-preview-content {
      border: 1px solid var(--color-gray-light);
      padding-bottom: 30px;
      border-radius: 0.2rem;
    }
  }
</style>
