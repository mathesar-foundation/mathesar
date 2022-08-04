<script lang="ts">
  import { Button } from '@mathesar-component-library';
  import {
    Sheet,
    SheetHeader,
    SheetVirtualRows,
    SheetRow,
    SheetCell,
    SheetCellResizer,
  } from '@mathesar/components/sheet';
  import CellFabric from '@mathesar/components/cell-fabric/CellFabric.svelte';
  import ColumnName from '@mathesar/components/ColumnName.svelte';
  import type QueryManager from '../QueryManager';

  export let queryManager: QueryManager;

  $: ({ query, processedQueryColumns, records, state, selectedColumnAlias } =
    queryManager);
  $: ({ base_table, initial_columns } = $query);

  $: columnRunState = $state.columnsFetchState?.state;
  $: recordRunState = $state.recordsFetchState?.state;

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
    queryManager.clearSelectedColumn();
  }
</script>

<div class="result">
  <div class="result-header">
    <span class="title">Result</span>
    {#if base_table && initial_columns.length}
      <span class="info">
        {#if columnRunState === 'success' && recordRunState === 'success'}
          Query run successfully
        {:else if columnRunState === 'processing' || recordRunState === 'processing'}
          Running query
        {:else if columnRunState === 'failure' || recordRunState === 'failure'}
          Query failed to run
        {/if}
      </span>
    {/if}
  </div>
  <div class="result-content">
    {#if !base_table}
      Please select the base table to start building the query
    {:else if !initial_columns.length}
      Please select a column from the column selection pane
    {:else}
      <Sheet
        columns={$processedQueryColumns}
        getColumnIdentifier={(c) => c.id}
        on:click={checkAndUnselectColumn}
      >
        <SheetHeader>
          {#each $processedQueryColumns as processedQueryColumn (processedQueryColumn.id)}
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
                    queryManager.selectColumn(
                      processedQueryColumn.column.alias,
                    );
                  }}
                >
                  <ColumnName
                    column={{
                      ...processedQueryColumn.column,
                      name:
                        processedQueryColumn.column.display_name ??
                        processedQueryColumn.column.alias,
                    }}
                  />
                </Button>
                <SheetCellResizer
                  columnIdentifierKey={processedQueryColumn.id}
                />
              </div>
            </SheetCell>
          {/each}
        </SheetHeader>

        <SheetVirtualRows
          itemCount={$records.results.length}
          paddingBottom={30}
          itemSize={() => 30}
          let:items
        >
          {#each items as item (item.key)}
            {#if $records.results[item.index]}
              <SheetRow style={item.style} let:htmlAttributes let:styleString>
                <div {...htmlAttributes} style={styleString}>
                  {#each $processedQueryColumns as processedQueryColumn (processedQueryColumn.id)}
                    <SheetCell
                      columnIdentifierKey={processedQueryColumn.id}
                      let:htmlAttributes
                      let:style
                    >
                      <div {...htmlAttributes} {style}>
                        <CellFabric
                          columnFabric={processedQueryColumn}
                          value={$records.results[item.index][
                            processedQueryColumn.id
                          ]}
                          showAsSkeleton={false}
                          disabled={true}
                        />
                      </div>
                    </SheetCell>
                  {/each}
                </div>
              </SheetRow>
            {/if}
          {/each}
        </SheetVirtualRows>
      </Sheet>
    {/if}
  </div>
</div>

<style lang="scss">
  .result {
    position: relative;
    flex-grow: 1;
    overflow: hidden;
    flex-shrink: 0;
    margin: 10px;
    display: flex;
    flex-direction: column;
    border: 1px solid #e5e5e5;
    border-radius: 4px;

    .result-header {
      padding: 8px 10px;
      border-bottom: 1px solid #e5e5e5;

      .title {
        font-weight: 600;
      }
      .info {
        margin-left: 8px;
        color: #71717a;
        font-size: 0.875rem;
      }
    }

    .result-content {
      position: relative;
      flex-grow: 1;
      overflow: hidden;
      flex-shrink: 0;
      display: flex;
    }

    :global(.column-name-wrapper) {
      flex: 1;
      padding: 6px 8px;
      overflow: hidden;
      height: 100%;
      display: block;
      overflow: hidden;
    }

    :global(.column-name-wrapper.selected) {
      background: #dedede !important;
    }
  }
</style>
