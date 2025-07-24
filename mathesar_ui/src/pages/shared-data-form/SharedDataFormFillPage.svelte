<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { RawDataForm, RawDataFormSource } from '@mathesar/api/rpc/forms';
  import Errors from '@mathesar/components/errors/Errors.svelte';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import type { RpcError } from '@mathesar/packages/json-rpc-client-builder';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import type { AsyncStoreValue } from '@mathesar/stores/AsyncStore';
  import {
    DataFormCanvas,
    ReadonlyDataFormManager,
    rawEphemeralFormToEphemeralFormProps,
  } from '@mathesar/systems/data-forms';

  export let rawDataForm: RawDataForm;
  export let formSourceInfo: AsyncStoreValue<RawDataFormSource, RpcError>;

  $: pageTitle = rawDataForm.header_title.text.trim() || rawDataForm.name;
  $: dataFormManager = formSourceInfo.resolvedValue
    ? new ReadonlyDataFormManager(
        rawEphemeralFormToEphemeralFormProps(
          rawDataForm,
          formSourceInfo.resolvedValue,
        ),
      )
    : undefined;
</script>

<svelte:head>
  <title>{makeSimplePageTitle(pageTitle)}</title>
</svelte:head>

<LayoutWithHeader fitViewport showHeader={false}>
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
