<script lang="ts">
  import { ImmutableMap } from '@mathesar-component-library';
  import {
    Sheet,
    SheetHeader,
    SheetVirtualRows,
    SheetRow,
    SheetCell,
    isColumnSelected,
  } from '@mathesar/components/sheet';
  import PaginationGroup from '@mathesar/components/PaginationGroup.svelte';
  import { rowHeaderWidthPx } from '@mathesar/geometry';
  import type QueryRunner from '../QueryRunner';
  import ResultHeaderCell from './ResultHeaderCell.svelte';
  import ResultRowCell from './ResultRowCell.svelte';

  export let queryRunner: QueryRunner;

  const ID_ROW_CONTROL_COLUMN = 'row-control';

  $: ({ query, processedColumns, rowsData, pagination, runState, selection } =
    queryRunner);
  $: ({ initial_columns } = $query);
  $: ({ selectedCells, columnsSelectedWhenTheTableIsEmpty } = selection);

  $: recordRunState = $runState?.state;
  $: errors = $runState?.state === 'failure' ? $runState.errors : [];
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

  const columnWidths = new ImmutableMap([
    [ID_ROW_CONTROL_COLUMN, rowHeaderWidthPx],
  ]);
</script>

<div data-identifier="query-run-result">
  {#if !initial_columns.length}
    <div class="empty-state">
      This exploration does not contain any columns. Edit the exploration to add
      columns to it.
    </div>
  {:else if errors.length}
    <div class="empty-state errors">
      {#each errors as error}
        <p>{error}</p>
      {/each}
    </div>
  {:else}
    <Sheet
      columns={sheetColumns}
      getColumnIdentifier={(c) => c.id}
      {columnWidths}
      usesVirtualList
    >
      <SheetHeader>
        <SheetCell
          columnIdentifierKey={ID_ROW_CONTROL_COLUMN}
          isStatic
          isControlCell
          let:htmlAttributes
          let:style
        >
          <div {...htmlAttributes} {style} />
        </SheetCell>

        {#each columnList as processedQueryColumn (processedQueryColumn.id)}
          <ResultHeaderCell
            {processedQueryColumn}
            {queryRunner}
            isSelected={isColumnSelected(
              $selectedCells,
              $columnsSelectedWhenTheTableIsEmpty,
              processedQueryColumn,
            )}
          />
        {/each}
      </SheetHeader>

      <SheetVirtualRows
        itemCount={sheetItemCount}
        paddingBottom={30}
        itemSize={() => 30}
        let:items
      >
        {#each items as item (item.key)}
          {#if rows[item.index] || showDummyGhostRow}
            <SheetRow style={item.style} let:htmlAttributes let:styleString>
              <div {...htmlAttributes} style={styleString}>
                <SheetCell
                  columnIdentifierKey={ID_ROW_CONTROL_COLUMN}
                  isStatic
                  isControlCell
                  let:htmlAttributes
                  let:style
                >
                  <div {...htmlAttributes} {style}>
                    {$pagination.offset + item.index + 1}
                  </div>
                </SheetCell>

                {#each columnList as processedQueryColumn (processedQueryColumn.id)}
                  <ResultRowCell
                    {processedQueryColumn}
                    row={rows[item.index]}
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
          Showing {$pagination.leftBound}-{Math.min(
            totalCount,
            $pagination.rightBound,
          )} of {totalCount}
        </div>
      {:else if recordRunState === 'success'}
        No results found
      {/if}
      <PaginationGroup
        pagination={$pagination}
        {totalCount}
        on:change={(e) => {
          void queryRunner.setPagination(e.detail);
        }}
      />
    </div>
  {/if}
</div>

<style lang="scss">
  [data-identifier='query-run-result'] {
    position: relative;
    flex-grow: 1;
    overflow: hidden;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;

    .empty-state {
      padding: 1rem;

      &.errors {
        color: var(--danger-color);
      }

      p {
        margin: 0;
      }
    }

    :global(.sheet) {
      bottom: 2.7rem;
    }

    [data-identifier='status-bar'] {
      flex-grow: 0;
      flex-shrink: 0;
      border-top: 1px solid #dfdfdf;
      padding: 0.2rem 0.6rem;
      display: flex;
      align-items: center;
      margin-top: auto;
      height: 2.7rem;

      :global(.pagination-group) {
        margin-left: auto;
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
      background: #dedede !important;
    }
    :global([data-sheet-element='cell'].selected) {
      background: #fafafa;
    }
  }
</style>
