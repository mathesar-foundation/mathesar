<script lang="ts">
  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import { getUsersStoreFromContext } from '@mathesar/stores/users';
  import {
    UserDetailsForm,
    PasswordChangeForm,
  } from '@mathesar/systems/users-and-permissions';
  import { getEditUsersPageUrl } from '../../routes/urls';

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
    <AppendBreadcrumb
      item={{
        type: 'simple',
        href: getEditUsersPageUrl(userId),
        label: user.username,
      }}
    />
    <UserDetailsForm {user} on:update={onUserUpdate} />
    <hr />
    <PasswordChangeForm {userId} />
  {/if}
{/await}
