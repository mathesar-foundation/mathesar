<script lang="ts">
  import { FormBuilder } from '@mathesar-component-library';
  import type { DbType } from '@mathesar/AppTypes';
  import type { AbstractType } from '@mathesar/stores/abstract-types/types';
  import type { FormBuildConfiguration } from '@mathesar-component-library/types';

  import DbTypeSelect from './DbTypeSelect.svelte';

  export let selectedDbType: DbType;
  export let selectedAbstractType: AbstractType;
  export let dbForm: FormBuildConfiguration | undefined;

  $: abstTypeHasMultipleDbTypes = selectedAbstractType.dbTypes.size
    ? selectedAbstractType.dbTypes.size > 1
    : false;

  $: showDbFormSelector = !dbForm && abstTypeHasMultipleDbTypes;
</script>

{#if dbForm}
  <FormBuilder form={dbForm} />
{:else if showDbFormSelector}
  <!--Temporary component, to be removed after all types are implemented-->
  <DbTypeSelect bind:selectedDbType {selectedAbstractType} />
{/if}
