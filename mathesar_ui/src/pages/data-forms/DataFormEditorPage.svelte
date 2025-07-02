<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { RawDataFormGetResponse } from '@mathesar/api/rpc/forms';
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

  export let dataForm: DataForm;
  export let formSourceInfo: AsyncStoreValue<
    RawDataFormGetResponse['field_col_info_map'],
    RpcError
  >;

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
    <DataFormCanvas {dataFormManager} />
  {:else if formSourceInfo.error}
    <Errors errors={[formSourceInfo.error]} />
  {/if}
</LayoutWithHeader>
