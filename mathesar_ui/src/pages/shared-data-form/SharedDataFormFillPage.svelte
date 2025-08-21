<script lang="ts">
  import { readable } from 'svelte/store';

  import type { RawDataForm, RawDataFormSource } from '@mathesar/api/rpc/forms';
  import Errors from '@mathesar/components/errors/Errors.svelte';
  import type { RpcError } from '@mathesar/packages/json-rpc-client-builder';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import type { AsyncStoreValue } from '@mathesar/stores/AsyncStore';
  import {
    DataForm,
    DataFormFillOutManager,
    DataFormStructure,
    FormSource,
  } from '@mathesar/systems/data-forms/form-maker';

  export let rawDataForm: RawDataForm;
  export let formSourceInfo: AsyncStoreValue<RawDataFormSource, RpcError>;

  $: pageTitle = rawDataForm.name.trim();
  $: dataFormManager = formSourceInfo.resolvedValue
    ? new DataFormFillOutManager({
        buildDataFormStructure: DataFormStructure.factoryFromRawInfo(
          rawDataForm,
          new FormSource(formSourceInfo.resolvedValue),
        ),
        token: readable(rawDataForm.token),
      })
    : undefined;
</script>

<svelte:head>
  <title>{makeSimplePageTitle(pageTitle)}</title>
</svelte:head>

{#if dataFormManager}
  <div class="data-form-filler">
    <DataForm {dataFormManager} />
  </div>
{:else if formSourceInfo.error}
  <Errors errors={[formSourceInfo.error]} />
{/if}

<style lang="scss">
  .data-form-filler {
    overflow: auto;
    position: relative;
    height: 100%;
    background: var(--elevated-background);
    padding: 0 0.5rem;
    --df__element-spacing: var(--sm3);
    --df__element-right-padding: 0;
  }
</style>
