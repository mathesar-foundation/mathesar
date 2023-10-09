<script lang="ts">
  import { Route } from 'tinro';

  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import { iconImportData } from '@mathesar/icons';
  import ImportPreviewPage from '@mathesar/pages/import/preview/ImportPreviewPage.svelte';
  import ImportUploadPage from '@mathesar/pages/import/upload/ImportUploadPage.svelte';
  import { getImportPageUrl, getImportPreviewPageQueryParams } from './urls';

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

<Route path="/:tableIdString" let:meta>
  {@const params = getImportPreviewPageQueryParams(meta.query)}
  {@const tableId = parseInt(meta.params.tableIdString, 10)}
  <ImportPreviewPage {database} {schema} {tableId} {...params} />
</Route>
