<script lang="ts">
  import { router } from 'tinro';
  import { getUsersStoreFromContext } from '@mathesar/stores/users';
  import { UserDetailsForm } from '@mathesar/systems/users-and-permissions';
  import { getEditUsersPageUrl } from '@mathesar/routes/urls';
  import type { User } from '@mathesar/api/users';

  const usersStore = getUsersStoreFromContext();

  function onUserCreate(user: User) {
    void $usersStore?.fetchUsers();
    router.goto(getEditUsersPageUrl(user.id), true);
  }
</script>

<UserDetailsForm on:create={(e) => onUserCreate(e.detail)} />
