<script lang="ts">
  import { MultiSelect } from '@mathesar-component-library';
  import type { ComponentAndProps } from '@mathesar-component-library/types';
  import type { ProcessedColumn } from '@mathesar/stores/table-data/types';
  import ColumnName from './column/ColumnName.svelte';

  export let availableColumns: ProcessedColumn[];
  export let columns: ProcessedColumn[] = [];

  function getLabel(column: ProcessedColumn): ComponentAndProps {
    return {
      component: ColumnName,
      props: {
        // TODO: how can we get type safety for these props?
        column: { ...column.column, constraintsType: [column.linkFk?.type] },
      },
    };
  }
</script>

<MultiSelect options={availableColumns} bind:values={columns} {getLabel} />
