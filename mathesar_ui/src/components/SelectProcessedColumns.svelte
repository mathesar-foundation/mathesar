<script lang="ts">
  import type { ProcessedColumn } from '@mathesar/stores/table-data';
  import { MultiSelect } from '@mathesar-component-library';
  import type { ComponentAndProps } from '@mathesar-component-library/types';

  import ProcessedColumnName from './column/ProcessedColumnName.svelte';

  export let options: ProcessedColumn[];
  export let value: ProcessedColumn[] = [];

  function getLabel(processedColumn: ProcessedColumn): ComponentAndProps {
    return {
      component: ProcessedColumnName,
      props: { processedColumn },
    };
  }
</script>

<MultiSelect {options} bind:values={value} {getLabel} />
