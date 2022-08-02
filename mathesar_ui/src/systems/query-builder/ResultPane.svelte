<script lang="ts">
  import {
    Sheet,
    SheetHeader,
    SheetVirtualRows,
    SheetRow,
    SheetCell,
    SheetCellResizer,
  } from '@mathesar/components/sheet';
  import type QueryManager from './QueryManager';

  export let queryManager: QueryManager;

  $: ({ query, columns, records } = queryManager);
  $: ({ base_table } = $query);
</script>

<div class="result">
  {#if !base_table}
    Please select the base table to start building the query
  {:else}
    <Sheet columns={$columns} getColumnIdentifier={(c) => c.alias}>
      <SheetHeader>
        {#each $columns as column (column.alias)}
          <SheetCell
            columnIdentifierKey={column.alias}
            let:htmlAttributes
            let:style
          >
            <div {...htmlAttributes} {style}>
              {column.name ?? column.alias}
              <SheetCellResizer columnIdentifierKey={column.alias} />
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
                {#each $columns as column (column.alias)}
                  <SheetCell
                    columnIdentifierKey={column.alias}
                    let:htmlAttributes
                    let:style
                  >
                    <div {...htmlAttributes} {style}>
                      {$records.results[item.index][column.alias]}
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
