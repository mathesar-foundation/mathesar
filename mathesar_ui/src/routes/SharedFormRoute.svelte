<script lang="ts">
  import { api } from '@mathesar/api/rpc';
  import { isDefinedNonNullable } from '@mathesar/component-library';
  import Errors from '@mathesar/components/errors/Errors.svelte';
  import type { RpcError } from '@mathesar/packages/json-rpc-client-builder';
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
  $: errors = [$rawFormStore.error, $formSourceInfo.error].filter(
    (e): e is RpcError => isDefinedNonNullable(e),
  );
</script>

{#if isLoading}
  <LoadingPage />
{:else if $rawFormStore.resolvedValue && $formSourceInfo.resolvedValue}
  <SharedDataFormFillPage
    rawDataForm={$rawFormStore.resolvedValue}
    formSource={$formSourceInfo.resolvedValue}
  />
{:else}
  <ErrorPage showGoToRoot={false}>
    <Errors {errors} showFallbackError />
  </ErrorPage>
{/if}
