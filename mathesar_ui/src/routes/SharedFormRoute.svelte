<script lang="ts">
  import { api } from '@mathesar/api/rpc';
  import Errors from '@mathesar/components/errors/Errors.svelte';
  import { RpcError } from '@mathesar/packages/json-rpc-client-builder';
  import ErrorPage from '@mathesar/pages/ErrorPage.svelte';
  import LoadingPage from '@mathesar/pages/LoadingPage.svelte';
  import SharedDataFormFillPage from '@mathesar/pages/shared-data-form/SharedDataFormFillPage.svelte';
  import AsyncRpcApiStore from '@mathesar/stores/AsyncRpcApiStore';

  export let formToken: string;

  const rawFormStore = new AsyncRpcApiStore(api.forms.get);
  const formSourceInfo = new AsyncRpcApiStore(api.forms.get_source_info);

  $: void AsyncRpcApiStore.runBatchConservatively([
    rawFormStore.batchRunner({ form_token: formToken }),
    formSourceInfo.batchRunner({ form_token: formToken }),
  ]);

  $: isLoading = $rawFormStore.isLoading || $formSourceInfo.isLoading;
</script>

{#if isLoading}
  <LoadingPage />
{:else if $rawFormStore.resolvedValue}
  <SharedDataFormFillPage
    rawDataForm={$rawFormStore.resolvedValue}
    formSourceInfo={$formSourceInfo}
  />
{:else}
  <ErrorPage showGoToRoot={false}>
    <Errors errors={[RpcError.fromAnything($rawFormStore.error)]} />
  </ErrorPage>
{/if}
