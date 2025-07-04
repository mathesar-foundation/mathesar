<script lang="ts">
  import type { Readable } from 'svelte/store';

  import ProcessedColumnName from '@mathesar/components/column/ProcessedColumnName.svelte';
  import type { ProcessedColumn } from '@mathesar/stores/table-data';
  import { ButtonMenuItem } from '@mathesar-component-library';

  export let processedColumn: ProcessedColumn;
  export let parentHasColumn: Readable<boolean>;

  $: disabled = $parentHasColumn || processedColumn.column.default?.is_dynamic;
</script>

<ButtonMenuItem {disabled} on:click>
  <ProcessedColumnName {processedColumn} />
</ButtonMenuItem>
