<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { router } from 'tinro';

  import Errors from '@mathesar/components/errors/Errors.svelte';
  import { DataFormRouteContext } from '@mathesar/contexts/DataFormRouteContext';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import { getSchemaPageUrl } from '@mathesar/routes/urls';
  import type { TableStructure } from '@mathesar/stores/table-data';
  import {
    DataFormCanvas,
    DataFormStructure,
    EditableDataFormManager,
    FormSource,
  } from '@mathesar/systems/data-forms/form-maker';
  import CacheManager from '@mathesar/utils/CacheManager';

  import ActionsPane from './ActionsPane.svelte';

  const dataFormRouteContext = DataFormRouteContext.get();
  $: ({ dataForm, rawDataFormWithSource, schemaRouteContext } =
    $dataFormRouteContext);

  const tableStructureCache = new CacheManager<
    TableStructure['oid'],
    TableStructure
  >(10);

  $: rawDataFormStore = dataForm.toRawDataFormStore();
  $: void rawDataFormWithSource.run($rawDataFormStore);
  $: rawDataFormWithSourceValue = $rawDataFormWithSource.resolvedValue;

  $: dataFormManager = rawDataFormWithSourceValue
    ? new EditableDataFormManager({
        buildDataFormStructure: DataFormStructure.factoryFromRawInfo(
          rawDataFormWithSourceValue.rawDataForm,
          new FormSource(rawDataFormWithSourceValue.rawFormSource),
        ),
        schema: dataForm.schema,
        tableStructureCache,
        deleteDataForm: async () => {
          const { schema } = dataForm;
          await schemaRouteContext.removeDataForm(dataForm);
          router.goto(getSchemaPageUrl(schema.database.id, schema.oid));
        },
      })
    : undefined;
</script>

<svelte:head>
  <title>{makeSimplePageTitle($rawDataFormStore.name)}</title>
</svelte:head>

<LayoutWithHeader fitViewport>
  {#if dataFormManager}
    <div class="data-form-editor">
      <div class="actions-pane">
        <ActionsPane {dataFormManager} />
      </div>
      <DataFormCanvas {dataFormManager} />
    </div>
  {:else if $rawDataFormWithSource.error}
    <Errors errors={[$rawDataFormWithSource.error]} />
  {/if}
</LayoutWithHeader>

<style lang="scss">
  .data-form-editor {
    display: grid;
    grid-template-rows: auto 1fr;
    height: 100%;
  }
</style>
