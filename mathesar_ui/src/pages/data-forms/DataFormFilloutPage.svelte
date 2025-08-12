<script lang="ts">
  import { _ } from 'svelte-i18n';

  import Errors from '@mathesar/components/errors/Errors.svelte';
  import { DataFormRouteContext } from '@mathesar/contexts/DataFormRouteContext';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import {
    DataFormCanvas,
    DataFormStructure,
    FormSource,
    ReadonlyDataFormManager,
  } from '@mathesar/systems/data-forms/form-maker';

  const dataFormRouteContext = DataFormRouteContext.get();
  $: ({ dataForm, rawDataFormWithSource } = $dataFormRouteContext);

  $: rawDataFormStore = dataForm.toRawDataFormStore();
  $: void rawDataFormWithSource.run($rawDataFormStore);
  $: rawDataFormWithSourceValue = $rawDataFormWithSource.resolvedValue;

  $: dataFormManager = rawDataFormWithSourceValue
    ? new ReadonlyDataFormManager(
        DataFormStructure.factoryFromRawInfo(
          rawDataFormWithSourceValue.rawDataForm,
          new FormSource(rawDataFormWithSourceValue.rawFormSource),
        ),
      )
    : undefined;
</script>

<svelte:head>
  <title>{makeSimplePageTitle($_('fill_form'))}</title>
</svelte:head>

<LayoutWithHeader fitViewport>
  {#if dataFormManager}
    <div class="data-form-filler">
      <DataFormCanvas {dataFormManager} />
    </div>
  {:else if $rawDataFormWithSource.error}
    <Errors errors={[$rawDataFormWithSource.error]} />
  {/if}
</LayoutWithHeader>

<style lang="scss">
  .data-form-filler {
    height: 100%;
    overflow: hidden;
  }
</style>
