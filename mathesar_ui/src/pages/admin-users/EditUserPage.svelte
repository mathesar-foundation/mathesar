<script lang="ts">
  import { router } from 'tinro';

  import { Icon, SpinnerButton } from '@mathesar-component-library';
  import type { User } from '@mathesar/api/users';
  import { iconDeleteMajor, iconEdit } from '@mathesar/icons';
  import { ADMIN_USERS_PAGE_URL } from '@mathesar/routes/urls';
  import { confirmDelete } from '@mathesar/stores/confirmation';
  import { toast } from '@mathesar/stores/toast';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import { getUsersStoreFromContext } from '@mathesar/stores/users';
  import {
    PasswordChangeForm,
    UserDetailsForm,
  } from '@mathesar/systems/users-and-permissions';
  import FormBox from './FormBox.svelte';

  const userProfileStore = getUserProfileStoreFromContext();
  const usersStore = getUsersStoreFromContext();

  export let userId: number;

  $: requestStatus = usersStore?.requestStatus;
  $: userDetailsPromise = usersStore?.getUserDetails(userId);
  $: userIsLoggedInUser = $userProfileStore?.id === userId;

  async function onUserUpdate() {
    await usersStore?.fetchUsers();
    userDetailsPromise = usersStore?.getUserDetails(userId);
  }

  async function deleteUser(user: User) {
    if (!usersStore) {
      return;
    }
    try {
      await usersStore.delete(user.id);
      router.goto(ADMIN_USERS_PAGE_URL);
    } catch (e) {
      toast.fromError(e);
    }
  }
</script>

{#await userDetailsPromise}
  Fetching user details
{:then user}
  {#if user === undefined}
    {#if $requestStatus?.state === 'failure'}
      {$requestStatus.errors}
    {:else}
      User not found
    {/if}
  {:else}
    <h1>
      <Icon {...iconEdit} />
      Edit User: <strong>{user.username}</strong>
    </h1>
    <FormBox>
      <UserDetailsForm {user} on:update={onUserUpdate} />
    </FormBox>
    <FormBox>
      <PasswordChangeForm {userId} />
    </FormBox>
    {#if !userIsLoggedInUser}
      <FormBox>
        <SpinnerButton
          confirm={() =>
            confirmDelete({
              identifierName: user.username,
              identifierType: 'user',
            })}
          onClick={() => deleteUser(user)}
          icon={iconDeleteMajor}
          danger
          label="Delete User"
          appearance="default"
        />
      </FormBox>
    {/if}
  {/if}
{/await}
