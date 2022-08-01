<script lang="ts">
  import {
    Sheet,
    SheetHeader,
    SheetVirtualRows,
    SheetRow,
    SheetCell,
    SheetCellResizer,
  } from '@mathesar/components/sheet';
  import CellFabric from '@mathesar/components/cell-fabric/CellFabric.svelte';
  import type QueryManager from '../QueryManager';

  export let queryManager: QueryManager;

  $: ({ query, processedQueryColumns, records } = queryManager);
  $: ({ base_table } = $query);
</script>

<div class="result">
  {#if !base_table}
    Please select the base table to start building the query
  {:else}
    <Sheet columns={$processedQueryColumns} getColumnIdentifier={(c) => c.id}>
      <SheetHeader>
        {#each $processedQueryColumns as processedQueryColumn (processedQueryColumn.id)}
          <SheetCell
            columnIdentifierKey={processedQueryColumn.id}
            let:htmlAttributes
            let:style
          >
            <div {...htmlAttributes} {style}>
              {processedQueryColumn.column.name ?? processedQueryColumn.id}
              <SheetCellResizer columnIdentifierKey={processedQueryColumn.id} />
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

<style lang="scss">
  .result {
    position: relative;
    flex-grow: 1;
    height: 100%;
    overflow: hidden;
    flex-shrink: 0;
  }
</style>
