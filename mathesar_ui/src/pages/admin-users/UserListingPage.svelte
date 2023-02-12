<script lang="ts">
  import { getUsersStoreFromContext } from '@mathesar/stores/users';
  import { ADMIN_USERS_PAGE_ADD_NEW_URL } from '@mathesar/routes/urls';
  import {
    AnchorButton,
    Icon
  } from '@mathesar/component-library';
  import { iconAddNew } from '@mathesar/icons';
  import type { User } from '@mathesar/api/users';
  import { labeledCount } from '@mathesar/utils/languageUtils';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import UserRow from './UserRow.svelte';
  import EntityLayout from '../../components/EntityLayout.svelte';
  import UserSkeleton from './UserSkeleton.svelte';

  let filterQuery = '';

  const usersStore = getUsersStoreFromContext();
  $: requestStatus = usersStore?.requestStatus;
  $: users = usersStore?.users;

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
    <UserSkeleton />
  {:else if $requestStatus?.state === 'success'}
    <h1>
      Users ({filteredUsers.length})
    </h1>
    <EntityLayout
    searchPlaceholder="Search Users"
    bind:searchQuery={filterQuery}
    on:clear={handleClearFilterQuery}>
      <slot slot="action">
        <AnchorButton appearance="primary" href={ADMIN_USERS_PAGE_ADD_NEW_URL}>
          <Icon {...iconAddNew} />
          <span>Add user</span>
        </AnchorButton>
      </slot>
      <slot slot="resultInfo">
        <p>
          {labeledCount(filteredUsers, 'results')}
          for all users matching <strong>{filterQuery}</strong>
        </p>
      </slot>
      <slot slot="content">
        {#if filteredUsers.length}
          <div class="users-list">
            {#each filteredUsers as user, index (user.id)}
              {#if index !== 0}
                <hr />
              {/if}
              <UserRow {user} />
            {/each}
          </div>
        {:else if filteredUsers.length === 0}
          <p class="no-users-found-text">No users found</p>
        {/if}
      </slot>
    </EntityLayout>
  {:else if $requestStatus?.state === 'failure'}
    <ErrorBox>
        <p>Error: {$requestStatus.errors}</p>
    </ErrorBox>
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

</style>
