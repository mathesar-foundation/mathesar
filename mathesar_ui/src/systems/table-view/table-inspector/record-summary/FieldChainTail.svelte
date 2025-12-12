<script lang="ts">
  import Spinner from '@mathesar/component-library/spinner/Spinner.svelte';
  import type { Schema } from '@mathesar/models/Schema';
  import type { TableStructure } from '@mathesar/stores/table-data';

  import FieldChain from './FieldChain.svelte';

  export let schema: Schema;
  export let columnIds: string[];
  export let referentTable: TableStructure;
  export let onUpdate: (columnIds: string[]) => void;

  $: ({ isLoading, processedColumns } = referentTable);
</script>

{#if $isLoading}
  <div class="loading">
    <Spinner />
  </div>
{:else}
  <FieldChain {schema} {columnIds} columns={$processedColumns} {onUpdate} />
{/if}

<style>
  .loading {
    margin: 0.6rem 0 0 0.5rem;
  }
</style>
