<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { RawDataFormSource } from '@mathesar/api/rpc/forms';
  import Errors from '@mathesar/components/errors/Errors.svelte';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import type { DataForm } from '@mathesar/models/DataForm';
  import type { RpcError } from '@mathesar/packages/json-rpc-client-builder';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import type { AsyncStoreValue } from '@mathesar/stores/AsyncStore';
  import type { TableStructure } from '@mathesar/stores/table-data';
  import {
    DataFormCanvas,
    EditableDataFormManager,
    EphemeralDataForm,
  } from '@mathesar/systems/data-forms';
  import CacheManager from '@mathesar/utils/CacheManager';

  import ActionsPane from './ActionsPane.svelte';

  export let dataForm: DataForm;
  export let formSourceInfo: AsyncStoreValue<RawDataFormSource, RpcError>;

  const tableStructureCache = new CacheManager<
    TableStructure['oid'],
    TableStructure
  >(10);

  $: dataFormManager = formSourceInfo.resolvedValue
    ? new EditableDataFormManager(
        EphemeralDataForm.fromRawEphemeralDataForm(
          dataForm.toRawDataForm(),
          formSourceInfo.resolvedValue,
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
        <ActionsPane {dataForm} {dataFormManager} />
      </div>
      <DataFormCanvas {dataFormManager} />
    </div>
  {:else if formSourceInfo.error}
    <Errors errors={[formSourceInfo.error]} />
  {/if}
</LayoutWithHeader>

<style lang="scss">
  .data-form-editor {
    display: grid;
    grid-template-rows: auto 1fr;
    height: 100%;
  }
</style>
