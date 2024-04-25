<script lang="ts">
  import { map } from 'iter-tools';
  import { _ } from 'svelte-i18n';
  import { get } from 'svelte/store';

  import { ImmutableMap } from '@mathesar-component-library';
  import CellBackground from '@mathesar/components/CellBackground.svelte';
  import PaginationGroup from '@mathesar/components/PaginationGroup.svelte';
  import {
    Sheet,
    SheetHeader,
    SheetOriginCell,
    SheetRow,
    SheetRowHeaderCell,
    SheetVirtualRows,
  } from '@mathesar/components/sheet';
  import { SheetClipboardHandler } from '@mathesar/components/sheet/SheetClipboardHandler';
  import type { SheetCellDetails } from '@mathesar/components/sheet/selection';
  import { rowHeaderWidthPx, rowHeightPx } from '@mathesar/geometry';
  import { toast } from '@mathesar/stores/toast';
  import type MessageBus from '@mathesar/utils/MessageBus';
  import { arrayIndex } from '@mathesar/utils/typeUtils';
  import type QueryManager from '../QueryManager';
  import type QueryRunner from '../QueryRunner';
  import { getRowSelectionId } from '../QueryRunner';
  import QueryRefreshButton from './QueryRefreshButton.svelte';
  import QueryRunErrors from './QueryRunErrors.svelte';
  import ResultHeaderCell from './ResultHeaderCell.svelte';
  import ResultRowCell from './ResultRowCell.svelte';

  export let queryHandler: QueryRunner | QueryManager;
  export let isExplorationPage = false;
  export let cellSelectionStarted: MessageBus<SheetCellDetails> | undefined =
    undefined;

  const ID_ROW_CONTROL_COLUMN = 'row-control';
  const columnWidths = new ImmutableMap([
    [ID_ROW_CONTROL_COLUMN, rowHeaderWidthPx],
  ]);

  $: ({
    query,
    processedColumns,
    rowsData,
    selectableRowsMap,
    pagination,
    runState,
    selection,
  } = queryHandler);
  $: ({ initial_columns } = $query);
  $: clipboardHandler = new SheetClipboardHandler({
    getCopyingContext: () => ({
      rowsMap: new Map(map(([k, r]) => [k, r.record], get(selectableRowsMap))),
      columnsMap: get(processedColumns),
      recordSummaries: new ImmutableMap(),
      selectedRowIds: get(selection).rowIds,
      selectedColumnIds: get(selection).columnIds,
    }),
    showToastInfo: toast.info,
  });
  $: ({ columnIds } = $selection);
  $: recordRunState = $runState?.state;
  $: errors = $runState?.state === 'failure' ? $runState.errors : undefined;
  $: columnList = [...$processedColumns.values()];
  $: sheetColumns = columnList.length
    ? [{ id: ID_ROW_CONTROL_COLUMN }, ...columnList]
    : [];
  $: rows = $rowsData.rows;
  $: totalCount = $rowsData.totalCount;
  // Show a dummy ghost row when there are no records
  $: showDummyGhostRow =
    (recordRunState === 'success' || recordRunState === 'processing') &&
    !rows.length;
  $: sheetItemCount = showDummyGhostRow ? 1 : rows.length;
</script>

<div data-identifier="query-run-result">
  {#if !initial_columns.length}
    <div class="empty-state">
      {$_('add_columns_to_exploration_empty_message')}
    </div>
  {:else if errors}
    <div class="empty-state">
      <QueryRunErrors {errors} {queryHandler} />
    </div>
  {:else}
    <Sheet
      columns={sheetColumns}
      getColumnIdentifier={(c) => c.id}
      {columnWidths}
      {clipboardHandler}
      usesVirtualList
      {selection}
      {cellSelectionStarted}
    >
      <SheetHeader>
        <SheetOriginCell columnIdentifierKey={ID_ROW_CONTROL_COLUMN} />
        {#each columnList as processedQueryColumn (processedQueryColumn.id)}
          <ResultHeaderCell
            {processedQueryColumn}
            queryRunner={queryHandler}
            isSelected={columnIds.has(processedQueryColumn.id)}
          />
        {/each}
      </SheetHeader>

      <SheetVirtualRows
        itemCount={sheetItemCount}
        paddingBottom={30}
        itemSize={() => rowHeightPx}
        let:items
      >
        {#each items as item (item.key)}
          {@const row = arrayIndex(rows, item.index)}
          {@const rowSelectionId = (row && getRowSelectionId(row)) ?? ''}
          {@const isSelected = $selection.rowIds.has(rowSelectionId)}
          {#if row || showDummyGhostRow}
            <SheetRow style={item.style} let:htmlAttributes let:styleString>
              <div
                {...htmlAttributes}
                style="--cell-height:{rowHeightPx - 1}px;{styleString}"
              >
                <SheetRowHeaderCell
                  {rowSelectionId}
                  columnIdentifierKey={ID_ROW_CONTROL_COLUMN}
                >
                  <CellBackground color="var(--cell-bg-color-header)" />
                  <CellBackground
                    when={isSelected}
                    color="var(--cell-bg-color-row-selected)"
                  />
                  {$pagination.offset + item.index + 1}
                </SheetRowHeaderCell>

                {#each columnList as processedQueryColumn (processedQueryColumn.id)}
                  <ResultRowCell
                    {row}
                    {rowSelectionId}
                    column={processedQueryColumn}
                    {recordRunState}
                    {selection}
                  />
                {/each}
              </div>
            </SheetRow>
          {/if}
        {/each}
      </SheetVirtualRows>
    </Sheet>
    <div data-identifier="status-bar">
      {#if totalCount}
        <div>
          {$_('showing_n_to_m_of_total', {
            values: {
              leftBound: $pagination.leftBound,
              rightBound: Math.min(totalCount, $pagination.rightBound),
              totalCount,
            },
          })}
        </div>
      {:else if recordRunState === 'success'}
        {$_('no_results_found')}
      {/if}
      <div class="pagination-controls">
        <PaginationGroup
          pagination={$pagination}
          {totalCount}
          on:change={(e) => {
            void queryHandler.setPagination(e.detail);
          }}
        />
        {#if isExplorationPage}
          <QueryRefreshButton queryRunner={queryHandler} />
        {/if}
      </div>
    </div>
  {/if}
</div>

<style lang="scss">
  [data-identifier='query-run-result'] {
    height: 100%;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    --status-bar-height: 3rem;

    .empty-state {
      padding: 1rem;
      position: absolute;
      right: 0;
      left: 0;
      bottom: 0;
      top: 0;
      overflow: auto;
    }

    :global(.sheet) {
      bottom: var(--status-bar-height);
    }

    [data-identifier='status-bar'] {
      flex-grow: 0;
      flex-shrink: 0;
      border-top: 1px solid var(--slate-300);
      background-color: var(--slate-100);
      padding: 0.2rem 0.6rem;
      display: flex;
      align-items: center;
      margin-top: auto;
      height: var(--status-bar-height);

      .pagination-controls {
        margin-left: auto;
        display: flex;
        align-items: center;

        :global(.refresh-button) {
          margin-left: var(--size-xx-small);
        }
      }
    }

    :global(button.column-name-wrapper) {
      flex: 1;
      padding: 6px 8px;
      overflow: hidden;
      height: 100%;
      display: block;
      overflow: hidden;
      text-align: left;
    }

    :global(.column-name-wrapper.selected) {
      background: var(--slate-200) !important;
    }
    :global([data-sheet-element='data-cell'].selected) {
      background: var(--slate-100);
    }
  }
</style>
