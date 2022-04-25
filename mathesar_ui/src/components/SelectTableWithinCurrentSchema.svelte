<script lang="ts">
  import type { TableEntry } from '@mathesar/AppTypes';
  import { tables as tablesDataStore } from '@mathesar/stores/tables';
  import SelectTable from './SelectTable.svelte';

  export let table: TableEntry | undefined = undefined;
  export let prependBlank = false;

  $: tables = [...$tablesDataStore.data.values()];
</script>

<SelectTable {tables} bind:table {prependBlank} />
