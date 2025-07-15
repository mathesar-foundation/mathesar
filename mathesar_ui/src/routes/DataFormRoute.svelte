<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { Route } from 'tinro';

  import { api } from '@mathesar/api/rpc';
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import { SchemaRouteContext } from '@mathesar/contexts/SchemaRouteContext';
  import { iconForms } from '@mathesar/icons';
  import DataFormEditorPage from '@mathesar/pages/data-forms/DataFormEditorPage.svelte';
  import DataFormFilloutPage from '@mathesar/pages/data-forms/DataFormFilloutPage.svelte';
  import ErrorPage from '@mathesar/pages/ErrorPage.svelte';
  import LoadingPage from '@mathesar/pages/LoadingPage.svelte';
  import { getDataFormPageUrl } from '@mathesar/routes/urls';
  import AsyncRpcApiStore from '@mathesar/stores/AsyncRpcApiStore';
  import { ensureReadable } from '@mathesar-component-library';

  export let formId: number;

  const schemaRouteContext = SchemaRouteContext.get();
  $: ({ schema, dataForms } = $schemaRouteContext);
  $: formSourceInfo = (() => {
    const aysncStore = new AsyncRpcApiStore(api.forms.get, {
      staticProps: { database_id: schema.database.id, form_id: formId },
      postProcess: (rawFormResponse) => rawFormResponse.field_col_info_map,
    });
    return aysncStore;
  })();

  $: void AsyncRpcApiStore.runBatchConservatively([
    dataForms.batchRunner(),
    formSourceInfo.batchRunner(),
  ]);
  $: isLoading = $dataForms.isLoading || $formSourceInfo.isLoading;
  $: form = $dataForms.resolvedValue?.get(formId) ?? undefined;
  $: formName = form?.name ?? ensureReadable(undefined);
</script>

{#if form || isLoading}
  <AppendBreadcrumb
    item={{
      type: 'simple',
      href: getDataFormPageUrl(schema.database.id, schema.oid, formId),
      label: $formName ?? $_('data_forms'),
      icon: iconForms,
    }}
  />

  {#if isLoading}
    <LoadingPage />
  {/if}
{/if}

{#if !form && !isLoading}
  <ErrorPage>{$_('page_doesnt_exist')}</ErrorPage>
{/if}

<Route path="/">
  {#if !isLoading && form}
    <DataFormEditorPage dataForm={form} formSourceInfo={$formSourceInfo} />
  {/if}
</Route>

<Route path="/fillout/">
  {#if !isLoading && form}
    <DataFormFilloutPage dataForm={form} formSourceInfo={$formSourceInfo} />
  {/if}
</Route>
