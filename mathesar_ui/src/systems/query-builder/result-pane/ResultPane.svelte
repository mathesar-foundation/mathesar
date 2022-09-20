<script lang="ts">
  import { Button, Spinner, Icon } from '@mathesar-component-library';
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
  import { iconRefresh } from '@mathesar/icons';
  import type QueryRunner from '../QueryRunner';

  export let queryRunner: QueryRunner;

  $: ({
    query,
    processedColumns,
    records,
    selectedColumnAlias,
    pagination,
    runState,
  } = queryRunner);
  $: ({ base_table, initial_columns } = $query);

  $: columnRunState = $runState?.state;
  $: recordRunState = $runState?.state;

  $: errors = $runState?.state === 'failure' ? $runState.errors : [];
  $: columnList = [...$processedColumns.values()];
  // Show a dummy ghost row when there are no records
  $: showDummyGhostRow =
    recordRunState === 'success' && !$records.results.length;
  $: sheetItemCount = showDummyGhostRow ? 1 : $records.results.length;

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

<section data-identifier="result">
  <header>
    <span class="title">Result</span>
    {#if base_table && initial_columns.length}
      <span class="info">
        {#if columnRunState === 'processing' || recordRunState === 'processing'}
          Running query
          <Spinner />
        {:else if columnRunState === 'failure' || recordRunState === 'failure'}
          Query failed to run
          <Button
            appearance="plain"
            size="small"
            class="padding-zero"
            on:click={() => queryRunner.run()}
          >
            <Icon {...iconRefresh} size="0.6rem" />
            <span>Retry</span>
          </Button>
        {/if}
      </span>
    {/if}
  </header>
  <div data-identifier="result-content">
    {#if !base_table}
      <div class="empty-state">
        Please select the base table to get started.
      </div>
    {:else if !initial_columns.length}
      <div class="empty-state">
        Please add a column from the column selection pane to get started.
      </div>
    {:else if errors.length}
      <div class="empty-state errors">
        {#each errors as error}
          <p>{error}</p>
        {/each}
      </div>
    {:else}
      <Sheet
        columns={columnList}
        getColumnIdentifier={(c) => c.id}
        on:click={checkAndUnselectColumn}
        usesVirtualList
      >
        <SheetHeader>
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
                <SheetCellResizer
                  columnIdentifierKey={processedQueryColumn.id}
                />
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
            {#if $records.results[item.index] || showDummyGhostRow}
              <SheetRow style={item.style} let:htmlAttributes let:styleString>
                <div {...htmlAttributes} style={styleString}>
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
                        {#if $records.results[item.index]}
                          <CellFabric
                            columnFabric={processedQueryColumn}
                            value={$records.results[item.index][
                              processedQueryColumn.id
                            ]}
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
</section>

<style lang="scss">
  section {
    position: relative;
    flex-grow: 1;
    overflow: hidden;
    flex-shrink: 0;
    margin: 10px;
    display: flex;
    flex-direction: column;
    border: 1px solid #e5e5e5;
    border-radius: 4px;

    header {
      padding: 8px 10px;
      border-bottom: 1px solid #e5e5e5;
      display: flex;
      align-items: center;

      .title {
        font-weight: 600;
      }
      .info {
        margin-left: 8px;
        color: #71717a;
        font-size: 0.875rem;
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }
    }

    [data-identifier='result-content'] {
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
