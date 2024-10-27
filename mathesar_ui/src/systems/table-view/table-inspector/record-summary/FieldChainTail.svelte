<script lang="ts">
  import Spinner from '@mathesar/component-library/spinner/Spinner.svelte';
  import type { Database } from '@mathesar/models/Database';
  import type { TableStructure } from '@mathesar/stores/table-data';

  import FieldChain from './FieldChain.svelte';

  export let database: Pick<Database, 'id'>;
  export let columnIds: number[];
  export let referentTable: TableStructure;
  export let onUpdate: (columnIds: number[]) => void;

  $: ({ isLoading, processedColumns } = referentTable);
</script>

{#if $isLoading}
  <Spinner />
{:else}
  <FieldChain {database} {columnIds} columns={$processedColumns} {onUpdate} />
{/if}
