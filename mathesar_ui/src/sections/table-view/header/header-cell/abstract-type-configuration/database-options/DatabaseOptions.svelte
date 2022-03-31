<script lang="ts">
  import { FormBuilder } from '@mathesar-component-library';
  import type { DbType } from '@mathesar/App.d';
  import type { AbstractType } from '@mathesar/stores/abstract-types/types';
  import type { FormBuildConfiguration } from '@mathesar-component-library/types';

  import DbTypeSelect from './DbTypeSelect.svelte';
  import DbTypeIndicator from './DbTypeIndicator.svelte';

  export let selectedDbType: DbType;
  export let selectedAbstractType: AbstractType;
  export let dbForm: FormBuildConfiguration | undefined;

  $: abstTypeHasMultipleDbTypes = selectedAbstractType.dbTypes.size
    ? selectedAbstractType.dbTypes.size > 1
    : false;
</script>

{#if dbForm}
  <FormBuilder form={dbForm} />
  <DbTypeIndicator {selectedDbType} />
{:else if abstTypeHasMultipleDbTypes}
  <DbTypeSelect bind:selectedDbType {selectedAbstractType} />
{:else}
  <DbTypeIndicator {selectedDbType} />
{/if}
