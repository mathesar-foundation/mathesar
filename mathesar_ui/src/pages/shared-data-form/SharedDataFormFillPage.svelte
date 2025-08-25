<script lang="ts">
  import { readable } from 'svelte/store';

  import type { RawDataForm, RawDataFormSource } from '@mathesar/api/rpc/forms';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import {
    DataForm,
    DataFormFillOutManager,
    DataFormStructure,
    FormSource,
  } from '@mathesar/systems/data-forms/form-maker';

  export let rawDataForm: RawDataForm;
  export let formSource: RawDataFormSource;

  $: pageTitle = rawDataForm.name.trim();
  $: dataFormManager = new DataFormFillOutManager({
    buildDataFormStructure: DataFormStructure.factoryFromRawInfo(
      rawDataForm,
      new FormSource(formSource),
    ),
    token: readable(rawDataForm.token),
  });
</script>

<svelte:head>
  <title>{makeSimplePageTitle(pageTitle)}</title>
</svelte:head>

<div class="data-form-filler">
  <DataForm {dataFormManager} />
</div>

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
