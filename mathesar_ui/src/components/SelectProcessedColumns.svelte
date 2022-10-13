<script lang="ts">
  import { MultiSelect } from '@mathesar-component-library';
  import type { ComponentAndProps } from '@mathesar-component-library/types';
  import type { ProcessedColumn } from '@mathesar/stores/table-data';
  import ProcessedColumnName from './column/ProcessedColumnName.svelte';

  export let availableColumns: ProcessedColumn[];
  export let columns: ProcessedColumn[] = [];

  function getLabel(processedColumn: ProcessedColumn): ComponentAndProps {
    return {
      component: ProcessedColumnName,
      props: { processedColumn },
    };
  }
</script>

<MultiSelect options={availableColumns} bind:values={columns} {getLabel} />
