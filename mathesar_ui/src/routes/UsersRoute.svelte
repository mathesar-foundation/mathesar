<script lang="ts">
  import { Route } from 'tinro';
  import UserListingPage from '@mathesar/pages/admin-users/UserListingPage.svelte';
  import NewUserPage from '@mathesar/pages/admin-users/NewUserPage.svelte';
  import EditUserPage from '@mathesar/pages/admin-users/EditUserPage.svelte';
  import { setUsersStoreInContext } from '@mathesar/stores/users';

  setUsersStoreInContext();
</script>

<Route path="/">
  <UserListingPage />
</Route>
<Route path="/new">
  <NewUserPage />
</Route>
<Route path="/:userId" let:meta>
  <EditUserPage userId={parseInt(meta.params.userId, 10)} />
</Route>
