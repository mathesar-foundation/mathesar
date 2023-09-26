<script lang="ts">
  import { Route } from 'tinro';
  import AddDatabaseConnection from '@mathesar/pages/database-connection/AddDatabaseConnection.svelte';
  import EditDatabaseConnection from '@mathesar/pages/database-connection/EditDatabaseConnection.svelte';
  import DatabaseConnectionsList from '@mathesar/pages/database-connection/DatabaseConnectionsList.svelte';
</script>

<Route path="/">
  <DatabaseConnectionsList />
</Route>

<Route path="/add">
  <AddDatabaseConnection />
</Route>

<Route path="/edit/:databaseName" let:meta>
  <EditDatabaseConnection
    databaseName={decodeURIComponent(meta.params.databaseName)}
  />
</Route>
