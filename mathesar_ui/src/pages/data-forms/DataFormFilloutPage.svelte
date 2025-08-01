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
  $: ({ dataForm, formSourceInfo } = $dataFormRouteContext);

  $: rawDataFormStore = dataForm.toRawDataFormStore();
  $: dataFormManager = $formSourceInfo.resolvedValue
    ? new ReadonlyDataFormManager(
        DataFormStructure.factoryFromRawInfo(
          $rawDataFormStore,
          new FormSource($formSourceInfo.resolvedValue),
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
  {:else if $formSourceInfo.error}
    <Errors errors={[$formSourceInfo.error]} />
  {/if}
</LayoutWithHeader>

<style lang="scss">
  .data-form-filler {
    height: 100%;
    overflow: hidden;
  }
</style>
