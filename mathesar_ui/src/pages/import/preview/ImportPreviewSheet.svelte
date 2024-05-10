<script lang="ts">
  import type { Column } from '@mathesar/api/rest/types/tables/columns';
  import CellFabric from '@mathesar/components/cell-fabric/CellFabric.svelte';
  import {
    Sheet,
    SheetCell,
    SheetCellResizer,
    SheetHeader,
    SheetRow,
  } from '@mathesar/components/sheet';

  import type {
    ColumnProperties,
    ProcessedPreviewColumn,
  } from './importPreviewPageUtils';
  import PreviewColumn from './PreviewColumn.svelte';

  export let columns: ProcessedPreviewColumn[];
  export let isLoading: boolean;
  export let updateTypeRelatedOptions: (options: Column) => Promise<unknown>;
  export let columnPropertiesMap: Record<number, ColumnProperties>;
  export let records: Record<string, unknown>[];
</script>

<div class="import-preview">
  <Sheet restrictWidthToRowWidth {columns} getColumnIdentifier={(c) => c.id}>
    <SheetHeader inheritFontStyle>
      {#each columns as column (column.id)}
        <SheetCell columnIdentifierKey={column.id} let:htmlAttributes let:style>
          <div {...htmlAttributes} {style}>
            <PreviewColumn
              {isLoading}
              processedColumn={column}
              {updateTypeRelatedOptions}
              bind:selected={columnPropertiesMap[column.id].selected}
              bind:displayName={columnPropertiesMap[column.id].displayName}
            />
            <SheetCellResizer
              columnIdentifierKey={column.id}
              minColumnWidth={120}
            />
          </div>
        </SheetCell>
      {/each}
    </SheetHeader>
    {#each records as record (record)}
      <SheetRow
        style={{ position: 'relative', height: 30 }}
        let:htmlAttributes
        let:styleString
      >
        <div {...htmlAttributes} style={styleString}>
          {#each columns as column (column)}
            <SheetCell
              columnIdentifierKey={column.id}
              let:htmlAttributes={sheetCellHtmlAttributes}
              let:style
            >
              <div {...sheetCellHtmlAttributes} {style}>
                <CellFabric
                  columnFabric={column}
                  value={record[column.column.name]}
                  showAsSkeleton={isLoading}
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

<style lang="scss">
  .import-preview {
    :global([data-sheet-element='row'] [data-sheet-element='cell']) {
      background: var(--white);
    }
    :global([data-sheet-element] [data-sheet-element='cell']:last-child) {
      border-right: none;
    }
    :global([data-sheet-element='row']:last-child [data-sheet-element='cell']) {
      border-bottom: none;
    }
  }
</style>
