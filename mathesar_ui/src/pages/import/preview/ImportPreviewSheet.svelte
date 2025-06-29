<script lang="ts">
  import type { RawColumnWithMetadata } from '@mathesar/api/rpc/columns';
  import CellFabric from '@mathesar/components/cell-fabric/CellFabric.svelte';
  import {
    Sheet,
    SheetCellResizer,
    SheetColumnHeaderCell,
    SheetDataCell,
    SheetHeader,
    SheetRow,
  } from '@mathesar/components/sheet';
  import { MIN_IMPORT_COLUMN_WIDTH_PX } from '@mathesar/geometry';

  import type {
    ColumnProperties,
    ProcessedPreviewColumn,
  } from './importPreviewPageUtils';
  import PreviewColumn from './PreviewColumn.svelte';

  export let columns: ProcessedPreviewColumn[];
  export let isLoading: boolean;
  export let updateTypeRelatedOptions: (
    options: RawColumnWithMetadata,
  ) => Promise<unknown>;
  export let columnPropertiesMap: Record<number, ColumnProperties>;
  export let records: Record<string, unknown>[];
  /**
   * The column attnum of any PK column which was automatically added by
   * Mathesar as part of the import process.
   */
  export let addedPkAttnum: number | undefined = undefined;
  export let renamedIdColumn: string | undefined;
</script>

<div class="import-preview">
  <Sheet restrictWidthToRowWidth {columns} getColumnIdentifier={(c) => c.id}>
    <SheetHeader inheritFontStyle>
      {#each columns as column (column.id)}
        <SheetColumnHeaderCell columnIdentifierKey={column.id}>
          <PreviewColumn
            {isLoading}
            processedColumn={column}
            {updateTypeRelatedOptions}
            bind:selected={columnPropertiesMap[column.id].selected}
            bind:displayName={columnPropertiesMap[column.id].displayName}
            isAutoAdded={column.id === addedPkAttnum}
            {renamedIdColumn}
          />
          <SheetCellResizer
            columnIdentifierKey={column.id}
            minColumnWidth={MIN_IMPORT_COLUMN_WIDTH_PX}
          />
        </SheetColumnHeaderCell>
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
            <SheetDataCell columnIdentifierKey={column.id}>
              <CellFabric
                columnFabric={column}
                value={record[column.column.name]}
                showAsSkeleton={isLoading}
                disabled={true}
              />
            </SheetDataCell>
          {/each}
        </div>
      </SheetRow>
    {/each}
  </Sheet>
</div>

<style lang="scss">
  .import-preview {
    :global([data-sheet-element='data-cell']) {
      background: var(--white);
    }
    :global([data-sheet-element='data-cell']:last-child),
    :global([data-sheet-element='column-header-cell']:last-child) {
      border-right: none;
    }
    :global(
        [data-sheet-element='data-row']:last-child
          [data-sheet-element='data-cell']
      ) {
      border-bottom: none;
    }
  }

  :global(body.theme-dark) .import-preview {
    :global([data-sheet-element='data-cell']) {
      background: var(--neutral-900);
    }
  }
</style>
