<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { Route } from 'tinro';

  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import { DataFormRouteContext } from '@mathesar/contexts/DataFormRouteContext';
  import { SchemaRouteContext } from '@mathesar/contexts/SchemaRouteContext';
  import { iconForm } from '@mathesar/icons';
  import DataFormEditorPage from '@mathesar/pages/data-forms/DataFormEditorPage.svelte';
  import DataFormFilloutPage from '@mathesar/pages/data-forms/DataFormFilloutPage.svelte';
  import ErrorPage from '@mathesar/pages/ErrorPage.svelte';
  import LoadingPage from '@mathesar/pages/LoadingPage.svelte';
  import { getDataFormPageUrl } from '@mathesar/routes/urls';
  import { ensureReadable } from '@mathesar-component-library';

  export let formId: number;

  const schemaRouteContext = SchemaRouteContext.get();
  $: ({ schema, dataForms, dataFormsFetch } = $schemaRouteContext);

  $: void dataFormsFetch.runConservatively();
  $: form = $dataForms.get(formId);
  $: dataFormRouteContext = form
    ? DataFormRouteContext.construct($schemaRouteContext, form)
    : ensureReadable(undefined);

  $: formStructure = ensureReadable(form?.structure);
</script>

{#if $dataFormsFetch.isLoading}
  <LoadingPage />
{/if}

{#if !form && $dataFormsFetch.hasSettled}
  <ErrorPage>{$_('page_doesnt_exist')}</ErrorPage>
{/if}

{#if $dataFormRouteContext && $formStructure}
  <AppendBreadcrumb
    item={{
      type: 'simple',
      href: getDataFormPageUrl(schema.database.id, schema.oid, formId),
      label: $formStructure?.name ?? $_('form'),
      icon: iconForm,
    }}
  />

  <Route path="/">
    <DataFormEditorPage />
  </Route>

  <Route path="/fillout/">
    <DataFormFilloutPage />
  </Route>
{/if}
