<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { Route } from 'tinro';

  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import { iconImportData } from '@mathesar/icons';
  import type { Database } from '@mathesar/models/Database';
  import type { Schema } from '@mathesar/models/Schema';
  import ImportPreviewPage from '@mathesar/pages/import/preview/ImportPreviewPage.svelte';
  import ImportUploadPage from '@mathesar/pages/import/upload/ImportUploadPage.svelte';

  import { getImportPageUrl, getImportPreviewPageQueryParams } from './urls';

  export let database: Database;
  export let schema: Schema;
</script>

<AppendBreadcrumb
  item={{
    type: 'simple',
    href: getImportPageUrl(database.id, schema.oid),
    label: $_('import'),
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
