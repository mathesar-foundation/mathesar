<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { Route } from 'tinro';
  import { iconMultipleUsers } from '@mathesar/icons';
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import UserListingPage from '@mathesar/pages/admin-users/UserListingPage.svelte';
  import NewUserPage from '@mathesar/pages/admin-users/NewUserPage.svelte';
  import EditUserPage from '@mathesar/pages/admin-users/EditUserPage.svelte';
  import { setUsersStoreInContext } from '@mathesar/stores/users';
  import { ADMIN_USERS_PAGE_URL } from '@mathesar/routes/urls';

  setUsersStoreInContext();
</script>

<AppendBreadcrumb
  item={{
    type: 'simple',
    href: ADMIN_USERS_PAGE_URL,
    label: $_('users'),
    icon: iconMultipleUsers,
  }}
/>

<Route path="/">
  <UserListingPage />
</Route>
<Route path="/new">
  <NewUserPage />
</Route>
<Route path="/:userId" let:meta>
  <EditUserPage userId={parseInt(meta.params.userId, 10)} />
</Route>
