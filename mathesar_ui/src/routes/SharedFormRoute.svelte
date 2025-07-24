<script lang="ts">
  import { api } from '@mathesar/api/rpc';
  import Errors from '@mathesar/components/errors/Errors.svelte';
  import { RpcError } from '@mathesar/packages/json-rpc-client-builder';
  import ErrorPage from '@mathesar/pages/ErrorPage.svelte';
  import LoadingPage from '@mathesar/pages/LoadingPage.svelte';
  import SharedDataFormFillPage from '@mathesar/pages/shared-data-form/SharedDataFormFillPage.svelte';
  import AsyncRpcApiStore from '@mathesar/stores/AsyncRpcApiStore';

  // TODO_FORMS: Replace with formToken
  export let formId: number;

  const rawFormStore = new AsyncRpcApiStore(api.forms.get);
  $: void rawFormStore.run({ form_id: formId });
  $: form = $rawFormStore.resolvedValue;

  const formSourceInfo = new AsyncRpcApiStore(api.forms.get_source_info);
  $: if (form?.token) {
    void formSourceInfo.run({ form_token: form.token });
  } else {
    formSourceInfo.reset();
  }

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
