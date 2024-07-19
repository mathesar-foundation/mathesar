<script lang="ts">
  import type { Table } from '@mathesar/api/rpc/tables';
  import { importVerifiedTables } from '@mathesar/stores/tables';
  import type { SelectProps } from '@mathesar-component-library/types';

  import SelectTable from './SelectTable.svelte';

  export let value: Table | undefined = undefined;
  export let prependBlank = false;
  export let autoSelect: SelectProps<Table | undefined>['autoSelect'] = 'first';

  $: tables = [...$importVerifiedTables.values()];
</script>

<SelectTable {tables} bind:value {prependBlank} {autoSelect} on:change />
