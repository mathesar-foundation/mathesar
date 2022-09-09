<script lang="ts">
  import { Route } from 'tinro';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import ImportUploadPage from '@mathesar/pages/import-upload/ImportUploadPage.svelte';
  import ImportPreviewPage from '@mathesar/pages/import-preview/ImportPreviewPage.svelte';

  export let database: Database;
  export let schema: SchemaEntry;
</script>

<Route path="/">
  <ImportUploadPage {database} {schema} />
</Route>

<Route path="/:previewTableId" let:meta>
  <ImportPreviewPage {database} {schema} />
</Route>
