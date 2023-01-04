<script lang="ts">
  import type { ComponentProps } from 'svelte';

  import type { ProcessedColumn } from '@mathesar/stores/table-data';
  import ColumnName from './ColumnName.svelte';
  import type { DisplayColumn } from './types';

  interface $$Props extends Omit<ComponentProps<ColumnName>, 'column'> {
    processedColumn: ProcessedColumn;
  }

  export let processedColumn: ProcessedColumn;

  function getDisplayColumn(c: ProcessedColumn): DisplayColumn {
    return {
      ...c.column,
      constraintsType: c.linkFk ? [c.linkFk.type] : undefined,
    };
  }

  $: displayColumn = getDisplayColumn(processedColumn);
</script>

<ColumnName column={displayColumn} {...$$restProps} />
