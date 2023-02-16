<script lang="ts">
  import { router } from 'tinro';

  import { Icon } from '@mathesar-component-library';
  import type { User } from '@mathesar/api/users';
  import { iconAddUser } from '@mathesar/icons';
  import { getEditUsersPageUrl } from '@mathesar/routes/urls';
  import { getUsersStoreFromContext } from '@mathesar/stores/users';
  import { UserDetailsForm } from '@mathesar/systems/users-and-permissions';
  import FormBox from './FormBox.svelte';

  const usersStore = getUsersStoreFromContext();

  function onUserCreate(user: User) {
    void usersStore?.fetchUsers();
    router.goto(getEditUsersPageUrl(user.id), true);
  }
</script>

<h1><Icon {...iconAddUser} /> New User</h1>

<FormBox>
  <UserDetailsForm on:create={(e) => onUserCreate(e.detail)} />
</FormBox>
