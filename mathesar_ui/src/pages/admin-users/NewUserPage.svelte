<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { router } from 'tinro';

  import type { User } from '@mathesar/api/rpc/users';
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import FormBox from '@mathesar/components/form/FormBox.svelte';
  import { iconAddUser } from '@mathesar/icons';
  import {
    ADMIN_USERS_PAGE_ADD_NEW_URL,
    getEditUsersPageUrl,
  } from '@mathesar/routes/urls';
  import { getUsersStoreFromContext } from '@mathesar/stores/users';
  import { UserDetailsForm } from '@mathesar/systems/users';
  import { Icon } from '@mathesar-component-library';

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
    label: $_('new_user'),
    icon: iconAddUser,
    prependSeparator: true,
  }}
/>

<h1><Icon {...iconAddUser} /> {$_('new_user')}</h1>

<FormBox>
  <UserDetailsForm on:create={(e) => onUserCreate(e.detail)} />
</FormBox>
