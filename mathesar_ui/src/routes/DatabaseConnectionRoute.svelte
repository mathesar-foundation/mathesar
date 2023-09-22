<script lang="ts">
  import { Route } from 'tinro';
  import AddDatabaseConnection from '@mathesar/pages/database-connection/AddDatabaseConnection.svelte';
  import EditDatabaseConnection from '@mathesar/pages/database-connection/EditDatabaseConnection.svelte';
  import { ADD_DATABASE_CONNECTION_URL } from './urls';
</script>

<Route path="/" redirect={ADD_DATABASE_CONNECTION_URL} />

<Route path="/add">
  <AddDatabaseConnection />
</Route>

<Route path="/edit/:databaseName" let:meta>
  <EditDatabaseConnection
    databaseName={decodeURIComponent(meta.params.databaseName)}
  />
</Route>
