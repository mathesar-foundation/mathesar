<script lang="ts">
  import ColumnName from '@mathesar/components/column/ColumnName.svelte';
  import {
    SheetCellResizer,
    SheetColumnHeaderCell,
  } from '@mathesar/components/sheet';
  import { Button } from '@mathesar-component-library';

  import type { QueryRunner } from '../QueryRunner';
  import type { ProcessedQueryOutputColumn } from '../utils';

  export let queryRunner: QueryRunner;
  export let processedQueryColumn: ProcessedQueryOutputColumn;
  export let isSelected: boolean;
  export let setColumnWidth: (width: number | null) => void;

  $: ({ runState } = queryRunner);
  $: columnRunState = $runState?.state;

  function handleAfterResize(width: number): Promise<void> {
    setColumnWidth(width);
    return Promise.resolve();
  }

  function handleReset(): Promise<void> {
    setColumnWidth(null);
    return Promise.resolve();
  }
</script>

<SheetColumnHeaderCell columnIdentifierKey={processedQueryColumn.id}>
  <Button
    appearance="plain"
    class="column-name-wrapper {isSelected ? 'selected' : ''}"
  >
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
    afterResize={handleAfterResize}
    onReset={handleReset}
  />
</SheetColumnHeaderCell>
