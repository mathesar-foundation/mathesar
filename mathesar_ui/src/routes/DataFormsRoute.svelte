<script lang="ts">
  import { _ } from 'svelte-i18n';

  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import { iconForms } from '@mathesar/icons';
  import type { Schema } from '@mathesar/models/Schema';
  import DataFormsPage from '@mathesar/pages/data-forms/DataFormsPage.svelte';
  import { getDataFormMakerPageUrl } from '@mathesar/routes/urls';

  export let schema: Schema;
</script>

<AppendBreadcrumb
  item={{
    type: 'simple',
    href: getDataFormMakerPageUrl(schema.database.id, schema.oid),
    label: $_('data_forms'),
    icon: iconForms,
  }}
/>

<DataFormsPage {schema} />
