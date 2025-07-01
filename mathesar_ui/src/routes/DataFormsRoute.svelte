<script lang="ts">
  import { _ } from 'svelte-i18n';

  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import { SchemaRouteContext } from '@mathesar/contexts/SchemaRouteContext';
  import { iconForms } from '@mathesar/icons';
  import DataFormsPage from '@mathesar/pages/data-forms/DataFormsPage.svelte';
  import { getNewDataFormPageUrl } from '@mathesar/routes/urls';

  const schemaRouteContext = SchemaRouteContext.get();

  $: ({ schema } = $schemaRouteContext);
</script>

<AppendBreadcrumb
  item={{
    type: 'simple',
    href: getNewDataFormPageUrl(schema.database.id, schema.oid),
    label: $_('data_forms'),
    icon: iconForms,
  }}
/>

<DataFormsPage {schema} />
