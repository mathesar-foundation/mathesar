<script lang="ts">
  import ColumnName from '@mathesar/components/column/ColumnName.svelte';
  import { SheetCell, SheetCellResizer } from '@mathesar/components/sheet';
  import { Button } from '@mathesar-component-library';

  import type QueryRunner from '../QueryRunner';
  import type { ProcessedQueryOutputColumn } from '../utils';

  export let queryRunner: QueryRunner;
  export let processedQueryColumn: ProcessedQueryOutputColumn;
  export let isSelected: boolean;

  $: ({ runState } = queryRunner);

  $: columnRunState = $runState?.state;
</script>

<SheetCell
  columnIdentifierKey={processedQueryColumn.id}
  let:htmlAttributes
  let:style
>
  <div {...htmlAttributes} {style}>
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
  </div>
</SheetCell>
