<script lang="ts">
  import { getUsersStoreFromContext } from '@mathesar/stores/users';
  import {
    getEditUsersPageUrl,
    ADMIN_USERS_PAGE_ADD_NEW_URL,
  } from '@mathesar/routes/urls';

  const usersStore = getUsersStoreFromContext();
  $: requestStatus = $usersStore?.requestStatus;
  $: users = $usersStore?.users;
  $: usersCount = $usersStore?.count;
</script>

{#if $requestStatus?.state === 'processing'}
  Loading
{:else if $requestStatus?.state === 'success'}
  <div>{$usersCount} users</div>
  <div>
    <a class="btn btn-primary" href={ADMIN_USERS_PAGE_ADD_NEW_URL}>
      Add user
    </a>
  </div>
  <div>
    {#each $users ?? [] as user}
      <div>
        <a href={getEditUsersPageUrl(user.id)}>
          {user.full_name}
        </a>
      </div>
    {/each}
  </div>
{:else if $requestStatus?.state === 'failure'}
  Error: {$requestStatus.errors}
{/if}
