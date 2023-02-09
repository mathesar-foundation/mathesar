<script lang="ts">
  import { getUsersStoreFromContext } from '@mathesar/stores/users';
  import { ADMIN_USERS_PAGE_ADD_NEW_URL } from '@mathesar/routes/urls';
  import {
    AnchorButton,
    Button,
    Icon,
    iconSearch,
    TextInputWithPrefix,
  } from '@mathesar/component-library';
  import { iconAddNew } from '@mathesar/icons';
  import type { User } from '@mathesar/api/users';
  import { labeledCount } from '@mathesar/utils/languageUtils';
  import UserRow from './UserRow.svelte';

  let filterQuery = '';

  const usersStore = getUsersStoreFromContext();
  $: requestStatus = $usersStore?.requestStatus;
  $: users = $usersStore?.users;

  function filterUsers(_users: User[], query: string) {
    const isMatch = (user: User, q: string) =>
      user.username.toLowerCase().includes(q) ||
      user.full_name?.toLowerCase().includes(q) ||
      user.email?.toLowerCase().includes(q);
    return _users?.filter((user) => {
      if (query) {
        const sanitizedQuery = query.trim().toLowerCase();
        return isMatch(user, sanitizedQuery);
      }
      return true;
    });
  }

  function handleClearFilterQuery() {
    filterQuery = '';
  }

  $: filteredUsers = filterUsers($users ?? [], filterQuery);
</script>

<section class="users-list-container">
  {#if $requestStatus?.state === 'processing'}
    <p>Loading...</p>
  {:else if $requestStatus?.state === 'success'}
    <h1>
      Users ({filteredUsers.length})
    </h1>
    <div class="user-search-container">
      <div class="user-search">
        <div class="user-search-box">
          <TextInputWithPrefix
            placeholder="Search Users"
            bind:value={filterQuery}
            prefixIcon={iconSearch}
          />
        </div>
        <AnchorButton appearance="primary" href={ADMIN_USERS_PAGE_ADD_NEW_URL}>
          <Icon {...iconAddNew} />
          <span>Add user</span>
        </AnchorButton>
      </div>

      {#if filterQuery}
        <div class="user-search-results-info">
          <p>
            {labeledCount(filteredUsers, 'results')}
            for all users matching <strong>{filterQuery}</strong>
          </p>
          <Button
            size="small"
            appearance="secondary"
            on:click={handleClearFilterQuery}
          >
            Clear
          </Button>
        </div>
      {/if}
    </div>

    {#if filteredUsers.length}
      <div class="users-list">
        {#each filteredUsers as user, index (user.id)}
          {#if index !== 0}
            <hr />
          {/if}
          <UserRow {user} />
        {/each}
      </div>
    {:else if !filterQuery}
      <p class="no-users-found-text">No users found</p>
    {/if}
  {:else if $requestStatus?.state === 'failure'}
    <p class="error-text">Error: {$requestStatus.errors}</p>
  {/if}
</section>

<style lang="scss">
  .users-list-container {
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 1rem;
    }
  }

  h1 {
    font-size: var(--text-size-ultra-large);
    font-weight: normal;
    margin: 0;
  }

  .user-search {
    display: flex;

    > :global(* + *) {
      margin-left: 1rem;
    }

    :global(.user-search-box) {
      flex: 1;
    }
  }

  .user-search-results-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .users-list {
    border: 1px solid var(--slate-200);
    border-radius: var(--border-radius-m);

    hr {
      border: 0;
      border-top: 1px solid var(--slate-200);
      display: block;
      margin: 0 var(--size-xx-small);
    }
  }

  .error-text {
    color: var(--red-500);
  }
</style>
