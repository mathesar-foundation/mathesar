<script lang="ts">
  import type { DbType } from '@mathesar/App.d';
  import type {
    AbstractType,
    AbstractTypeDbConfigOptions,
  } from '@mathesar/stores/abstract-types/types';

  import DbForm from './DbForm.svelte';
  import DbTypeSelect from './DbTypeSelect.svelte';

  export let selectedDbType: DbType;
  export let selectedAbstractType: AbstractType;
  export let dbOptions: AbstractTypeDbConfigOptions = undefined;
</script>

{#if dbOptions}
  <DbForm bind:selectedDbType {dbOptions}/>
  Type in DB {selectedDbType}

{:else if selectedAbstractType.dbTypes.size > 1}
  <DbTypeSelect bind:selectedDbType {selectedAbstractType}/>

{:else}
  Type in DB {selectedDbType}
{/if}
