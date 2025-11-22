<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { Route } from 'tinro';

  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import { DataFormRouteContext } from '@mathesar/contexts/DataFormRouteContext';
  import { SchemaRouteContext } from '@mathesar/contexts/SchemaRouteContext';
  import DataFormEditorPage from '@mathesar/pages/data-forms/DataFormEditorPage.svelte';
  import ErrorPage from '@mathesar/pages/ErrorPage.svelte';
  import LoadingPage from '@mathesar/pages/LoadingPage.svelte';
  import { ensureReadable } from '@mathesar-component-library';

  export let formId: number;

  const schemaRouteContext = SchemaRouteContext.get();
  $: ({ dataForms, dataFormsFetch } = $schemaRouteContext);

  $: void dataFormsFetch.runConservatively();
  $: form = $dataForms.get(formId);
  $: dataFormRouteContext = form
    ? DataFormRouteContext.construct($schemaRouteContext, form)
    : ensureReadable(undefined);
</script>

{#if $dataFormsFetch.isLoading}
  <LoadingPage />
{/if}

{#if !form && $dataFormsFetch.hasSettled}
  <ErrorPage>{$_('page_doesnt_exist')}</ErrorPage>
{/if}

{#if $dataFormRouteContext && form}
  <AppendBreadcrumb
    item={{
      type: 'dataForm',
      dataForm: form,
    }}
  />

  <Route path="/">
    <DataFormEditorPage />
  </Route>
{/if}
