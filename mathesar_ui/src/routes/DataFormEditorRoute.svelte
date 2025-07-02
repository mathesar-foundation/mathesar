<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { api } from '@mathesar/api/rpc';
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import Errors from '@mathesar/components/errors/Errors.svelte';
  import { SchemaRouteContext } from '@mathesar/contexts/SchemaRouteContext';
  import { iconForms } from '@mathesar/icons';
  import DataFormEditorPage from '@mathesar/pages/data-forms/DataFormEditorPage.svelte';
  import ErrorPage from '@mathesar/pages/ErrorPage.svelte';
  import { getDataFormPageUrl } from '@mathesar/routes/urls';
  import AsyncRpcApiStore from '@mathesar/stores/AsyncRpcApiStore';
  import { Spinner, ensureReadable } from '@mathesar-component-library';

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

{#if isLoading}
  <Spinner />
{:else if form}
  <AppendBreadcrumb
    item={{
      type: 'simple',
      href: getDataFormPageUrl(schema.database.id, schema.oid, form.id),
      label: $formName ?? $_('data_forms'),
      icon: iconForms,
    }}
  />

  {#if $formSourceInfo.resolvedValue}
    <DataFormEditorPage dataForm={form} />
  {:else}
    <Errors
      errors={[$formSourceInfo.error ?? $_('error_fetching_form_source_info')]}
    />
  {/if}
{:else}
  <ErrorPage>{$_('page_doesnt_exist')}</ErrorPage>
{/if}
