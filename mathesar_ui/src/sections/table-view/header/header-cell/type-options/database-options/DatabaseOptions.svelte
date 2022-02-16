<script lang="ts">
  import type { DbType } from '@mathesar/App.d';
  import type { AbstractType } from '@mathesar/stores/abstract-types/types';
  import type { Column } from '@mathesar/stores/table-data/types';

  import DbForm from './DbForm.svelte';
  import DbTypeSelect from './DbTypeSelect.svelte';
  import DbTypeIndicator from './DbTypeIndicator.svelte';

  export let selectedDbType: DbType | undefined;
  export let typeOptions: Column['type_options'];
  export let selectedAbstractType: AbstractType | undefined;

  $: dbOptionsConfig =
    selectedAbstractType?.typeSwitchOptions?.database?.configuration ??
    undefined;
</script>

{#if dbOptionsConfig}
  {#key selectedAbstractType}
    <DbForm
      bind:selectedDbType
      bind:typeOptions
      configuration={dbOptionsConfig}
    />
  {/key}
  <DbTypeIndicator {selectedDbType} />
{:else if selectedAbstractType?.dbTypes.size}
  <DbTypeSelect bind:selectedDbType {selectedAbstractType} />
{:else}
  <DbTypeIndicator {selectedDbType} />
{/if}
