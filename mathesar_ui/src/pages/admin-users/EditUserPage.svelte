<script lang="ts">
  import { Icon } from '@mathesar-component-library';
  import { iconEdit } from '@mathesar/icons';
  import { getUsersStoreFromContext } from '@mathesar/stores/users';
  import {
    PasswordChangeForm,
    UserDetailsForm,
  } from '@mathesar/systems/users-and-permissions';
  import FormBox from './FormBox.svelte';

  const usersStore = getUsersStoreFromContext();

  export let userId: number;

  $: requestStatus = usersStore?.requestStatus;
  $: userDetailsPromise = usersStore?.getUserDetails(userId);

  async function onUserUpdate() {
    await usersStore?.fetchUsers();
    userDetailsPromise = usersStore?.getUserDetails(userId);
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
  {/if}
{/await}
