<script lang="ts">
  import { getUsersStoreFromContext } from '@mathesar/stores/users';
  import {
    UserDetailsForm,
    PasswordChangeForm,
  } from '@mathesar/systems/users-and-permissions';

  const usersStore = getUsersStoreFromContext();

  export let userId: number;

  $: requestStatus = $usersStore?.requestStatus;
  $: userDetailsPromise = $usersStore?.getUserDetails(userId);

  async function onUserUpdate() {
    await $usersStore?.fetchUsers();
    userDetailsPromise = $usersStore?.getUserDetails(userId);
  }
</script>

{#await userDetailsPromise}
  Fetching user details
{:then result}
  {#if result === undefined}
    {#if $requestStatus?.state === 'failure'}
      {$requestStatus.errors}
    {:else}
      User not found
    {/if}
  {:else}
    <UserDetailsForm userDetails={result} on:update={onUserUpdate} />
    <hr />
    <PasswordChangeForm {userId} />
  {/if}
{/await}
