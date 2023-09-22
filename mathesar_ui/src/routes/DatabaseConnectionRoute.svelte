<script lang="ts">
  import { Route } from 'tinro';
  import AddDatabaseConnection from '@mathesar/pages/database-connection/AddDatabaseConnection.svelte';
  import EditDatabaseConnection from '@mathesar/pages/database-connection/EditDatabaseConnection.svelte';
</script>

<Route path="/add">
  <AddDatabaseConnection />
</Route>

<Route path="/edit/:databaseName">
  <EditDatabaseConnection />
</Route>
