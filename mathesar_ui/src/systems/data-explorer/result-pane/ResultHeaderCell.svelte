<script lang="ts">
  import { Button } from '@mathesar-component-library';
  import { SheetCell, SheetCellResizer } from '@mathesar/components/sheet';
  import ColumnName from '@mathesar/components/column/ColumnName.svelte';
  import type { ProcessedQueryOutputColumn } from '../utils';
  import type QueryRunner from '../QueryRunner';

  export let queryRunner: QueryRunner;
  export let processedQueryColumn: ProcessedQueryOutputColumn;
  export let isSelected: boolean;

  $: ({ runState } = queryRunner);

  $: columnRunState = $runState?.state;
</script>

<SheetCell
  type="column-header-cell"
  columnIdentifierKey={processedQueryColumn.id}
>
  <Button
    appearance="plain"
    class="column-name-wrapper {isSelected ? 'selected' : ''}"
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
</SheetCell>
