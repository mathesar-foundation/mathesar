<script lang="ts">
  import { tick } from 'svelte';
  import { router } from 'tinro';
  import {
    getImportPreviewPageUrl,
    getTablePageUrl,
    getSchemaPageUrl,
  } from '@mathesar/routes/urls';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import InsetPageLayout from '@mathesar/layouts/InsetPageLayout.svelte';
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
  import type { TableEntry } from '@mathesar/api/types/tables';
  import type { Column } from '@mathesar/api/types/tables/columns';
  import { getAPI, patchAPI } from '@mathesar/api/utils/requestUtils';
  import type {
    RequestStatus,
    PaginatedResponse,
  } from '@mathesar/api/utils/requestUtils';
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
  import InfoBox from '@mathesar/components/message-boxes/InfoBox.svelte';
  import { iconDeleteMajor } from '@mathesar/icons';
  import { getCellCap } from '@mathesar/components/cell-fabric/utils';
  import { toast } from '@mathesar/stores/toast';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import { getErrorMessage } from '@mathesar/utils/errors';
  import PreviewColumn from './PreviewColumn.svelte';
  import ErrorInfo from './ErrorInfo.svelte';

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
        cellComponentAndProps: getCellCap({
          cellInfo: abstractType.cellInfo,
          column,
        }),
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
        errors: [
          err instanceof Error
            ? err.message
            : 'An error occurred while loading the preview.',
        ],
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

<LayoutWithHeader
  cssVariables={{
    '--max-layout-width': '65.357rem',
    '--layout-background-color': 'var(--sand-200)',
    '--inset-page-padding': 'var(--size-xx-large)',
    '--inset-layout-padding': '0',
  }}
>
  <div class="table-preview-confirmation">
    <InsetPageLayout>
      <h1 slot="header">Finish setting up your table</h1>

      {#if tableIsAlreadyConfirmed}
        Table has already been confirmed. Click here to view the table.
      {:else}
        <div class="table-properties">
          <LabeledInput layout="stacked">
            <h2 slot="label">Table Name</h2>
            <TextInput bind:value={tableName} />
          </LabeledInput>

          <div class="header-checkbox">
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

          <div class="help-content">
            <h2>Column names and data types</h2>
            <p>
              Column names and data types are automatically detected, use the
              controls in the preview table to review and update them if
              necessary.
            </p>
            {#if isLoading}
              <InfoBox fullWidth>
                <span>Please wait while we prepare a preview for you</span>
                <Spinner />
              </InfoBox>
            {:else if previewRequestStatus?.state === 'failure'}
              <ErrorInfo
                errors={previewRequestStatus.errors}
                on:retry={() => onPreviewTableIdChange(previewTableId)}
                on:delete={handleCancel}
              />
            {:else if headerUpdateRequestStatus?.state === 'failure'}
              <ErrorInfo
                errors={headerUpdateRequestStatus.errors}
                on:retry={updateDataFileHeader}
                on:delete={handleCancel}
              />
            {:else}
              <InfoBox fullWidth>
                Preview data is shown for the first few rows of your data only.
              </InfoBox>
            {/if}
          </div>
        </div>
      {/if}
    </InsetPageLayout>

    {#if !tableIsAlreadyConfirmed}
      {#if processedColumns.length > 0}
        <div class="table-preview-content">
          <div class="preview">
            <h2>Table Preview</h2>
            <div class="content">
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
                            bind:selected={columnProperties[processedColumn.id]
                              .selected}
                            bind:displayName={columnProperties[
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
            </div>
          </div>
        </div>
      {/if}

      <div class="footer">
        <div class="contain-width">
          {#if !isLoading}
            <CancelOrProceedButtonPair
              onCancel={handleCancel}
              onProceed={finishImport}
              cancelButton={{ icon: iconDeleteMajor }}
              proceedButton={{ label: 'Confirm & create table' }}
              {canProceed}
            />
          {/if}
        </div>
      </div>
    {/if}
  </div>
</LayoutWithHeader>

<style lang="scss">
  .table-preview-confirmation {
    --sheet-header-height: 5.25rem;
    position: relative;

    h1 {
      font-weight: 500;
      font-size: var(--size-xx-large);
      margin: 1em 0;
    }

    h2 {
      font-weight: 600;
      font-size: var(--size-large);
      margin: 0;
    }

    .table-properties {
      > :global(.labeled-input) {
        margin-bottom: 1rem;
      }

      .header-checkbox {
        font-size: var(--text-size-large);
      }

      .help-content {
        margin-top: 2rem;
        line-height: 1.6;

        p {
          margin: var(--size-xx-small) 0;
        }
      }
    }

    .table-preview-content {
      overflow: hidden;
      margin-top: var(--size-x-large);

      .preview {
        margin: 0 auto;
        overflow: hidden;
        max-width: 100%;
        background: var(--white);
        border-top: solid 1px var(--slate-300);

        h2 {
          padding: var(--size-small) var(--inset-page-padding);
          border-bottom: 1px solid var(--slate-200);
        }

        .content {
          padding: var(--inset-page-padding);
          background: var(--slate-50);
          margin-bottom: 5rem;
        }

        .sheet-holder {
          border: 1px solid var(--slate-200);
          max-width: fit-content;
          min-height: 20rem;
          overflow: auto;
          margin: 0 auto;
          background: var(--white);
        }

        :global(.sheet) {
          min-width: 64.8rem;
          margin: 0 auto;
        }

        :global(.sheet [data-sheet-element='header']) {
          background: var(--slate-100);
        }

        :global(.sheet [data-sheet-element='row'] [data-sheet-element='cell']) {
          background: var(--white);
        }
      }
    }

    .footer {
      width: 100%;
      border-top: 1px solid var(--slate-200);
      padding: 1rem 1rem 2rem 1rem;
      background: var(--white);
      position: fixed;
      bottom: 0;
      left: 0;
      > .contain-width {
        max-width: var(--max-layout-width);
        margin-left: auto;
        margin-right: auto;
      }
    }
  }
</style>
