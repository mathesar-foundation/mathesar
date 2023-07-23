<script lang="ts">
  import { router } from 'tinro';
  import { Icon } from '@mathesar-component-library';
  import type { User } from '@mathesar/api/users';
  import { iconAddUser } from '@mathesar/icons';
  import {
    getEditUsersPageUrl,
    ADMIN_USERS_PAGE_ADD_NEW_URL,
  } from '@mathesar/routes/urls';
  import { getUsersStoreFromContext } from '@mathesar/stores/users';
  import { UserDetailsForm } from '@mathesar/systems/users-and-permissions';
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import FormBox from './FormBox.svelte';
  import { LL } from '@mathesar/i18n/i18n-svelte';

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
    label: $LL.newUserPage.newUser(),
    icon: iconAddUser,
  }}
/>

<h1><Icon {...iconAddUser} /> {$LL.newUserPage.newUser()}</h1>

<FormBox>
  <UserDetailsForm on:create={(e) => onUserCreate(e.detail)} />
</FormBox>
