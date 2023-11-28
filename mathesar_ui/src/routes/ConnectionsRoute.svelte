<script lang="ts">
  import { Route } from 'tinro';
  import DatabaseConnectionsList from '@mathesar/pages/connections/DatabaseConnectionsList.svelte';
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
</script>

<Route path="/">
  <!-- <AppendBreadcrumb item={{ type: 'database', database }} /> -->

  <DatabaseConnectionsList />
</Route>
