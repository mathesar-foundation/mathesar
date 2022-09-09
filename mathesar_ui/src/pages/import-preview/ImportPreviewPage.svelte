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
  import type { MinimalColumnDetails, TableEntry } from '@mathesar/api/tables';
  import { getAPI, patchAPI } from '@mathesar/utils/api';
  import type { RequestStatus } from '@mathesar/utils/api';
  import {
    getTable,
    getTypeSuggestionsForTable,
    generateTablePreview,
    deleteTable,
    createTable,
  } from '@mathesar/stores/tables';

  export let database: Database;
  export let schema: SchemaEntry;
  export let previewTableId: number;

  let previewRequestStatus: RequestStatus;
  let tableName = '';
  let useFirstRowAsHeader = true;

  let tableInfo: TableEntry;
  let dataFileDetails: { id: number; header: boolean };
  let columns: MinimalColumnDetails[] = [];
  let records: Record<string, unknown>[] = [];

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
    }
    tableName = tableInfo.name;
    columns = tableInfo.columns;
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
      return;
    }

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
      await patchAPI(`/api/db/v0/data_files/${dataFileDetails.id}/`, {
        header: useFirstRowAsHeader,
      });
      tableInfo = await createTable(schema.id, {
        name: tableName,
        dataFiles: [dataFileDetails.id],
      });
      await deleteTable(previewTableId);
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

  <div class="table-config-options">
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

    <Sheet {columns} getColumnIdentifier={(c) => c.id}>
      <SheetHeader>
        {#each columns as column (column.id)}
          <SheetCell
            columnIdentifierKey={column.id}
            let:htmlAttributes
            let:style
          >
            <div {...htmlAttributes} {style}>
              <div>{column.name}</div>
              <div>{column.type}</div>
              <SheetCellResizer columnIdentifierKey={column.id} />
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
            {#each columns as column (column.id)}
              <SheetCell
                columnIdentifierKey={column.id}
                let:htmlAttributes
                let:style
              >
                <div {...htmlAttributes} {style}>
                  {String(record[column.name])}
                </div>
              </SheetCell>
            {/each}
          </div>
        </SheetRow>
      {/each}
    </Sheet>
  </div>
</LayoutWithHeader>
