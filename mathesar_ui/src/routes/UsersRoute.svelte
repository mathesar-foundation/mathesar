<script lang="ts">
  import { Route } from 'tinro';
  import UserListingPage from '@mathesar/pages/admin-users/UserListingPage.svelte';
  import NewUserPage from '@mathesar/pages/admin-users/NewUserPage.svelte';
  import EditUserPage from '@mathesar/pages/admin-users/EditUserPage.svelte';
  import { setUsersStoreContext } from '@mathesar/stores/users';

  setUsersStoreContext();
</script>

<Route path="/">
  <UserListingPage />
</Route>
<Route path="/new">
  <NewUserPage />
</Route>
<Route path="/:userId">
  <EditUserPage />
</Route>
