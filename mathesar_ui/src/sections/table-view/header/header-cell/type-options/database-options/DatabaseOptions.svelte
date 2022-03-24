<script lang="ts">
  import type { DbType } from '@mathesar/App.d';
  import type { AbstractType } from '@mathesar/stores/abstract-types/types';
  import type { Column } from '@mathesar/stores/table-data/types';

  import DbForm from './DbForm.svelte';
  import DbTypeSelect from './DbTypeSelect.svelte';
  import DbTypeIndicator from './DbTypeIndicator.svelte';

  export let selectedDbType: DbType;
  export let typeOptions: Column['type_options'];
  export let selectedAbstractType: AbstractType;
  export let column: Column;

  $: dbOptionsConfig = selectedAbstractType.getDbConfig?.() ?? undefined;
  $: abstTypeHasMultipleDbTypes = selectedAbstractType.dbTypes.size
    ? selectedAbstractType.dbTypes.size > 1
    : false;
</script>

{#if dbOptionsConfig}
  {#key selectedAbstractType}
    <DbForm
      bind:selectedDbType
      bind:typeOptions
      {column}
      configuration={dbOptionsConfig}
    />
  {/key}
  <DbTypeIndicator {selectedDbType} />
{:else if abstTypeHasMultipleDbTypes}
  <DbTypeSelect bind:selectedDbType {selectedAbstractType} />
{:else}
  <DbTypeIndicator {selectedDbType} />
{/if}
