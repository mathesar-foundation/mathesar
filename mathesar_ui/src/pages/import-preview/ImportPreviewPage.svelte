<script lang="ts">
  import { tick } from 'svelte';
  import { router } from 'tinro';

  import {
    CancelOrProceedButtonPair,
    Checkbox,
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
  import ErrorInfo from './ErrorInfo.svelte';
  import PreviewColumn from './PreviewColumn.svelte';
  import {
    getSkeletonRecords,
    processColumns,
    type ColumnProperties,
  } from './importPreviewPageUtils';

  export let database: Database;
  export let schema: SchemaEntry;
  export let tableId: number;
  export let useColumnTypeInference = false;

  let tableIsAlreadyConfirmed = false;
  let previewRequestStatus: RequestStatus;
  let headerUpdateRequestStatus: RequestStatus;
  let typeChangeRequestStatus: RequestStatus;
  let tableName = '';
  let useFirstRowAsHeader = true;
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

      if (useColumnTypeInference) {
        typeSuggestionRequest?.cancel();
        typeSuggestionRequest = getTypeSuggestionsForTable(_previewTableId);
      }
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
        dataFileDetails.header = useFirstRowAsHeader;
        await Promise.all([
          deleteTable(database, schema, tableId),
          dataFilesApi.update(dataFileDetails.id, {
            header: useFirstRowAsHeader,
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
          { useColumnTypeInference },
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
  cssVariables={{
    '--max-layout-width': 'var(--max-layout-width-data-pages)',
    '--layout-background-color': 'var(--sand-200)',
    '--inset-page-section-padding': 'var(--size-xx-large)',
    '--page-padding': 'var(--outer-page-padding-for-inset-page)',
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
            <h2 class="large-bold-header" slot="label">Table Name</h2>
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
            <h2 class="large-bold-header">Column names and data types</h2>
            <p>
              Column names {#if useColumnTypeInference} and data types {/if} are
              automatically detected, use the controls in the preview table to review
              and update them if necessary.
            </p>
            {#if isLoading}
              <InfoBox fullWidth>
                <span>Please wait while we prepare a preview for you</span>
                <Spinner />
              </InfoBox>
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
            <h2 class="large-bold-header">Table Preview</h2>
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
                            bind:selected={columnPropertiesMap[
                              processedColumn.id
                            ].selected}
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

    h2 {
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
          padding: var(--size-small) var(--inset-page-section-padding);
          border-bottom: 1px solid var(--slate-200);
        }

        .content {
          padding: var(--inset-page-section-padding);
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
