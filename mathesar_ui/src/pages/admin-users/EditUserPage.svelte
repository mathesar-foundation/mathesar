<script lang="ts">
  import { router } from 'tinro';
  import { Icon, SpinnerButton } from '@mathesar-component-library';
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
  import type { UserModel } from '@mathesar/stores/users';
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

  async function deleteUser(user: UserModel) {
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
{:then userModel}
  {#if userModel === undefined}
    {#if $requestStatus?.state === 'failure'}
      {$requestStatus.errors}
    {:else}
      User not found
    {/if}
  {:else}
    <h1>
      <Icon {...iconEdit} />
      Edit User: <strong>{userModel.username}</strong>
    </h1>
    <FormBox>
      <UserDetailsForm user={userModel.getUser()} on:update={onUserUpdate} />
    </FormBox>
    <FormBox>
      <PasswordChangeForm {userId} />
    </FormBox>
    {#if !userIsLoggedInUser}
      <FormBox>
        <SpinnerButton
          confirm={() =>
            confirmDelete({
              identifierName: userModel.username,
              identifierType: 'user',
            })}
          onClick={() => deleteUser(userModel)}
          icon={iconDeleteMajor}
          danger
          label="Delete User"
          appearance="default"
        />
      </FormBox>
    {/if}
  {/if}
{/await}
