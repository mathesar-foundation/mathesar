<script lang="ts">
  import { router } from 'tinro';
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import { getUsersStoreFromContext } from '@mathesar/stores/users';
  import { UserDetailsForm } from '@mathesar/systems/users-and-permissions';
  import { getEditUsersPageUrl } from '@mathesar/routes/urls';
  import type { User } from '@mathesar/api/users';
  import { ADMIN_USERS_PAGE_ADD_NEW_URL } from '../../routes/urls';

  const usersStore = getUsersStoreFromContext();

  function onUserCreate(user: User) {
    void usersStore?.fetchUsers();
    router.goto(getEditUsersPageUrl(user.id), true);
  }
</script>

<AppendBreadcrumb
  item={{
    type: 'simple',
    href: ADMIN_USERS_PAGE_ADD_NEW_URL,
    label: 'New',
  }}
/>

<UserDetailsForm on:create={(e) => onUserCreate(e.detail)} />
