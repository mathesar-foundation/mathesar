<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { Route } from 'tinro';

  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import { DataFormRouteContext } from '@mathesar/contexts/DataFormRouteContext';
  import { SchemaRouteContext } from '@mathesar/contexts/SchemaRouteContext';
  import { iconForms } from '@mathesar/icons';
  import DataFormEditorPage from '@mathesar/pages/data-forms/DataFormEditorPage.svelte';
  import DataFormFilloutPage from '@mathesar/pages/data-forms/DataFormFilloutPage.svelte';
  import ErrorPage from '@mathesar/pages/ErrorPage.svelte';
  import LoadingPage from '@mathesar/pages/LoadingPage.svelte';
  import { getDataFormPageUrl } from '@mathesar/routes/urls';
  import { ensureReadable } from '@mathesar-component-library';

  // TODO_FORMS: Replace this with form token
  export let formId: number;

  const schemaRouteContext = SchemaRouteContext.get();
  $: ({ schema, dataForms } = $schemaRouteContext);

  $: void dataForms.runConservatively();
  $: form = $dataForms.resolvedValue?.get(formId) ?? undefined;

  $: if (form) {
    DataFormRouteContext.construct($schemaRouteContext, form);
  }

  $: formName = ensureReadable(form?.name);
</script>

<AppendBreadcrumb
  item={{
    type: 'simple',
    href: getDataFormPageUrl(schema.database.id, schema.oid, formId),
    label: $formName ?? $_('data_forms'),
    icon: iconForms,
  }}
/>

{#if $dataForms.isLoading}
  <LoadingPage />
{/if}

{#if !form && $dataForms.hasSettled}
  <ErrorPage>{$_('page_doesnt_exist')}</ErrorPage>
{/if}

{#if form}
  <Route path="/">
    <DataFormEditorPage />
  </Route>

  <Route path="/fillout/">
    <DataFormFilloutPage />
  </Route>
{/if}
