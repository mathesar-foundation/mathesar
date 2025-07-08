<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { RawDataFormGetResponse } from '@mathesar/api/rpc/forms';
  import Errors from '@mathesar/components/errors/Errors.svelte';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import type { DataForm } from '@mathesar/models/DataForm';
  import type { RpcError } from '@mathesar/packages/json-rpc-client-builder';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import type { AsyncStoreValue } from '@mathesar/stores/AsyncStore';
  import {
    DataFormCanvas,
    EphemeralDataForm,
    ReadonlyDataFormManager,
  } from '@mathesar/systems/data-forms';

  export let dataForm: DataForm;
  export let formSourceInfo: AsyncStoreValue<
    RawDataFormGetResponse['field_col_info_map'],
    RpcError
  >;

  $: dataFormManager = formSourceInfo.resolvedValue
    ? new ReadonlyDataFormManager(
        EphemeralDataForm.fromRawEphemeralDataForm(
          dataForm.toRawDataForm(),
          formSourceInfo.resolvedValue,
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
  {:else if formSourceInfo.error}
    <Errors errors={[formSourceInfo.error]} />
  {/if}
</LayoutWithHeader>

<style lang="scss">
  .data-form-filler {
    height: 100%;
    overflow: hidden;
  }
</style>
