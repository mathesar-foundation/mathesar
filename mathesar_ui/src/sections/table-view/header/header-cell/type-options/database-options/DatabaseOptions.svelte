<script lang="ts">
  import type { DbType } from '@mathesar/App.d';
  import type {
    AbstractType,
    AbstractTypeDbConfigOptions,
  } from '@mathesar/stores/abstract-types/types';

  import DbForm from './DbForm.svelte';
  import DbTypeSelect from './DbTypeSelect.svelte';
  import DbTypeIndicator from './DbTypeIndicator.svelte';

  export let selectedDbType: DbType | undefined;
  export let selectedAbstractType: AbstractType | undefined;
  export let dbOptions: AbstractTypeDbConfigOptions | undefined = undefined;
</script>

{#if dbOptions?.configuration}
  <DbForm bind:selectedDbType configuration={dbOptions.configuration} />
  <DbTypeIndicator {selectedDbType} />
{:else if selectedAbstractType?.dbTypes.size > 1}
  <DbTypeSelect bind:selectedDbType {selectedAbstractType} />
{:else}
  <DbTypeIndicator {selectedDbType} />
{/if}
