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

  // TODO_FORMS: Replace this with form token
  export let formId: number;

  const schemaRouteContext = SchemaRouteContext.get();
  $: ({ schema, dataForms } = $schemaRouteContext);

  $: void dataForms.runConservatively();
  $: form = $dataForms.resolvedValue?.get(formId) ?? undefined;
  $: formToken = ensureReadable(form?.token);

  const formSourceInfo = new AsyncRpcApiStore(api.forms.get_source_info);
  $: if ($formToken) {
    void formSourceInfo.run({ form_token: $formToken });
  } else {
    formSourceInfo.reset();
  }

  $: isLoading = $dataForms.isLoading || $formSourceInfo.isLoading;
  $: formName = ensureReadable(form?.name);
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
