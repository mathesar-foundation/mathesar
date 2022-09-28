<script lang="ts">
  import { Button, ImmutableMap } from '@mathesar-component-library';
  import {
    Sheet,
    SheetHeader,
    SheetVirtualRows,
    SheetRow,
    SheetCell,
    SheetCellResizer,
  } from '@mathesar/components/sheet';
  import PaginationGroup from '@mathesar/components/PaginationGroup.svelte';
  import CellFabric from '@mathesar/components/cell-fabric/CellFabric.svelte';
  import ColumnName from '@mathesar/components/column/ColumnName.svelte';
  import type QueryRunner from '../QueryRunner';

  export let queryRunner: QueryRunner;

  const ID_ROW_CONTROL_COLUMN = 'row-control';

  $: ({
    query,
    processedColumns,
    records,
    selectedColumnAlias,
    pagination,
    runState,
  } = queryRunner);
  $: ({ initial_columns } = $query);

  $: columnRunState = $runState?.state;
  $: recordRunState = $runState?.state;

  $: errors = $runState?.state === 'failure' ? $runState.errors : [];
  $: columnList = [...$processedColumns.values()];
  $: sheetColumns = columnList.length
    ? [{ id: ID_ROW_CONTROL_COLUMN }, ...columnList]
    : [];
  $: results = $records.results ?? [];
  // Show a dummy ghost row when there are no records
  $: showDummyGhostRow =
    (recordRunState === 'success' || recordRunState === 'processing') &&
    !results.length;
  $: sheetItemCount = showDummyGhostRow ? 1 : results.length;

  const columnWidths = new ImmutableMap([[ID_ROW_CONTROL_COLUMN, 70]]);

  function checkAndUnselectColumn(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (
      target.closest(
        '[data-sheet-element="header"] [data-sheet-element="cell"]',
      )
    ) {
      return;
    }
    if ($selectedColumnAlias) {
      const closestCell = target.closest(
        '[data-sheet-element="row"] [data-sheet-element="cell"]',
      );
      if (
        closestCell &&
        closestCell.querySelector(
          `[data-column-identifier="${$selectedColumnAlias}"]`,
        )
      ) {
        return;
      }
    }
    queryRunner.clearSelectedColumn();
  }
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
      on:click={checkAndUnselectColumn}
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
          <SheetCell
            columnIdentifierKey={processedQueryColumn.id}
            let:htmlAttributes
            let:style
          >
            <div {...htmlAttributes} {style}>
              <Button
                appearance="plain"
                class="column-name-wrapper {$selectedColumnAlias ===
                processedQueryColumn.column.alias
                  ? 'selected'
                  : ''}"
                on:click={() => {
                  queryRunner.selectColumn(processedQueryColumn.column.alias);
                }}
              >
                <!--TODO: Use a separate prop to identify column that isn't fetched yet
                      instead of type:unknown-->
                <ColumnName
                  isLoading={columnRunState === 'processing' &&
                    processedQueryColumn.column.type === 'unknown'}
                  column={{
                    ...processedQueryColumn.column,
                    name:
                      processedQueryColumn.column.display_name ??
                      processedQueryColumn.column.alias,
                  }}
                />
              </Button>
              <SheetCellResizer columnIdentifierKey={processedQueryColumn.id} />
            </div>
          </SheetCell>
        {/each}
      </SheetHeader>

      <SheetVirtualRows
        itemCount={sheetItemCount}
        paddingBottom={30}
        itemSize={() => 30}
        let:items
      >
        {#each items as item (item.key)}
          {#if results[item.index] || showDummyGhostRow}
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
                  <SheetCell
                    columnIdentifierKey={processedQueryColumn.id}
                    let:htmlAttributes
                    let:style
                  >
                    <div
                      {...htmlAttributes}
                      {style}
                      class={$selectedColumnAlias ===
                      processedQueryColumn.column.alias
                        ? 'selected'
                        : ''}
                    >
                      {#if results[item.index] || recordRunState === 'processing'}
                        <CellFabric
                          columnFabric={processedQueryColumn}
                          value={results[item.index]?.[processedQueryColumn.id]}
                          showAsSkeleton={recordRunState === 'processing'}
                          disabled={true}
                        />
                      {/if}
                    </div>
                  </SheetCell>
                {/each}
              </div>
            </SheetRow>
          {/if}
        {/each}
      </SheetVirtualRows>
    </Sheet>
    <div data-identifier="status-bar">
      {#if $records.count}
        <div>
          Showing {$pagination.leftBound}-{Math.min(
            $records.count,
            $pagination.rightBound,
          )} of {$records.count}
        </div>
      {:else if recordRunState === 'success'}
        No results found
      {/if}
      <PaginationGroup
        pagination={$pagination}
        totalCount={$records.count}
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
      background: #fafafa;
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
