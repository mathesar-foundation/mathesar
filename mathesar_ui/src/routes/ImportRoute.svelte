<script lang="ts">
  import { Route } from 'tinro';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import ImportUploadPage from '@mathesar/pages/import-upload/ImportUploadPage.svelte';
  import ImportPreviewPage from '@mathesar/pages/import-preview/ImportPreviewPage.svelte';
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import { iconImportData } from '@mathesar/icons';
  import { getImportPageUrl } from './urls';

  export let database: Database;
  export let schema: SchemaEntry;
</script>

<AppendBreadcrumb
  item={{
    type: 'simple',
    href: getImportPageUrl(database.name, schema.id),
    label: 'Import',
    icon: iconImportData,
  }}
/>

<Route path="/">
  <ImportUploadPage {database} {schema} />
</Route>

<Route path="/:previewTableId" let:meta>
  <ImportPreviewPage
    {database}
    {schema}
    previewTableId={parseInt(meta.params.previewTableId, 10)}
  />
</Route>
