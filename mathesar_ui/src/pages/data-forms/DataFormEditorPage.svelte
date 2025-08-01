<script lang="ts">
  import { _ } from 'svelte-i18n';

  import Errors from '@mathesar/components/errors/Errors.svelte';
  import { DataFormRouteContext } from '@mathesar/contexts/DataFormRouteContext';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import type { TableStructure } from '@mathesar/stores/table-data';
  import {
    DataFormCanvas,
    EditableDataFormManager,
    rawDataFormToDataFormStructureProps,
  } from '@mathesar/systems/data-forms';
  import CacheManager from '@mathesar/utils/CacheManager';

  import ActionsPane from './ActionsPane.svelte';

  const dataFormRouteContext = DataFormRouteContext.get();
  $: ({ dataForm, formSourceInfo } = $dataFormRouteContext);

  const tableStructureCache = new CacheManager<
    TableStructure['oid'],
    TableStructure
  >(10);

  $: rawDataFormStore = dataForm.toRawDataFormStore();
  $: dataFormManager = $formSourceInfo.resolvedValue
    ? new EditableDataFormManager(
        rawDataFormToDataFormStructureProps(
          $rawDataFormStore,
          $formSourceInfo.resolvedValue,
        ),
        dataForm.schema,
        tableStructureCache,
      )
    : undefined;
</script>

<svelte:head>
  <title>{makeSimplePageTitle($_('form_maker'))}</title>
</svelte:head>

<LayoutWithHeader fitViewport>
  {#if dataFormManager}
    <div class="data-form-editor">
      <div class="actions-pane">
        <ActionsPane {dataFormManager} />
      </div>
      <DataFormCanvas {dataFormManager} />
    </div>
  {:else if $formSourceInfo.error}
    <Errors errors={[$formSourceInfo.error]} />
  {/if}
</LayoutWithHeader>

<style lang="scss">
  .data-form-editor {
    display: grid;
    grid-template-rows: auto 1fr;
    height: 100%;
  }
</style>
