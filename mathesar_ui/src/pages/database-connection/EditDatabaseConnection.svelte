<script lang="ts">
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import { getDatabaseConnectionEditUrl } from '@mathesar/routes/urls';

  export let databaseName = '';
</script>

<AppendBreadcrumb
  item={{
    type: 'simple',
    href: getDatabaseConnectionEditUrl(databaseName),
    label: 'Edit Database Connection',
  }}
/>
<div>Edit DB Connection for {databaseName}</div>
