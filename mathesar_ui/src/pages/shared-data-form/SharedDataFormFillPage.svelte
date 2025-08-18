<script lang="ts">
  import { readable } from 'svelte/store';

  import type { RawDataForm, RawDataFormSource } from '@mathesar/api/rpc/forms';
  import Errors from '@mathesar/components/errors/Errors.svelte';
  import type { RpcError } from '@mathesar/packages/json-rpc-client-builder';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import type { AsyncStoreValue } from '@mathesar/stores/AsyncStore';
  import {
    DataFormStructure,
    FormSource,
    ReadonlyDataFormManager,
  } from '@mathesar/systems/data-forms/form-maker';
  import DataFormBranding from '@mathesar/systems/data-forms/form-maker/DataFormBranding.svelte';
  import DataFormFieldsContainer from '@mathesar/systems/data-forms/form-maker/elements/DataFormFieldsContainer.svelte';
  import DataFormFooter from '@mathesar/systems/data-forms/form-maker/elements/DataFormFooter.svelte';
  import DataFormHeader from '@mathesar/systems/data-forms/form-maker/elements/DataFormHeader.svelte';

  export let rawDataForm: RawDataForm;
  export let formSourceInfo: AsyncStoreValue<RawDataFormSource, RpcError>;

  $: pageTitle = rawDataForm.name.trim();
  $: dataFormManager = formSourceInfo.resolvedValue
    ? new ReadonlyDataFormManager({
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
  {@const { fields } = dataFormManager.dataFormStructure}
  <div class="data-form-filler">
    <div class="form">
      <DataFormHeader {dataFormManager} />
      <DataFormFieldsContainer {fields} {dataFormManager} />
      <DataFormFooter {dataFormManager} />
      <div class="branding">
        <DataFormBranding />
      </div>
    </div>
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
    --data_forms__label-input-gap: var(--sm5);
    --data_forms__selectable-element-padding: var(--sm5) 0 var(--sm5) 1rem;

    .form {
      margin: 0 auto;
      max-width: 40rem;
      padding-right: 1rem;

      .branding {
        border-top: 1px solid var(--border-color);
        margin-top: var(--lg2);
      }
    }
  }
</style>
