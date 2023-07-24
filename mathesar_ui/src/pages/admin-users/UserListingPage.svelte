<script lang="ts">
  import { AnchorButton, Icon } from '@mathesar/component-library';
  import { iconAddNew } from '@mathesar/icons';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import { ADMIN_USERS_PAGE_ADD_NEW_URL } from '@mathesar/routes/urls';
  import type { UserModel } from '@mathesar/stores/users';
  import { getUsersStoreFromContext } from '@mathesar/stores/users';
  import { labeledCount } from '@mathesar/utils/languageUtils';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import EntityContainerWithFilterBar from '@mathesar/components/EntityContainerWithFilterBar.svelte';
  import { LL } from '@mathesar/i18n/i18n-svelte';
  import UserRow from './UserRow.svelte';
  import UserSkeleton from './UserSkeleton.svelte';

  let filterQuery = '';

  const usersStore = getUsersStoreFromContext();
  $: requestStatus = usersStore?.requestStatus;
  $: users = usersStore?.users;

  function filterUsers(_users: UserModel[], query: string) {
    const isMatch = (user: UserModel, q: string) =>
      user.username.toLowerCase().includes(q) ||
      user.fullName?.toLowerCase().includes(q) ||
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
  $: userCountText = filteredUsers.length ? `(${filteredUsers.length})` : '';
</script>

<svelte:head
  ><title>{makeSimplePageTitle($LL.general.users())}</title></svelte:head
>

<h1>Users {userCountText}</h1>

<section class="users-list-container">
  {#if $requestStatus?.state === 'processing'}
    <UserSkeleton />
  {:else if $requestStatus?.state === 'success'}
    <EntityContainerWithFilterBar
      searchPlaceholder={$LL.usersListingPage.searchUsers()}
      bind:searchQuery={filterQuery}
      on:clear={handleClearFilterQuery}
    >
      <slot slot="action">
        <AnchorButton appearance="primary" href={ADMIN_USERS_PAGE_ADD_NEW_URL}>
          <Icon {...iconAddNew} />
          <span>{$LL.usersListingPage.addUser()}</span>
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
          <p class="no-users-found-text">
            {$LL.usersListingPage.noUsersFound()}
          </p>
        {/if}
      </slot>
    </EntityContainerWithFilterBar>
  {:else if $requestStatus?.state === 'failure'}
    <ErrorBox>
      <p>{$LL.general.error()}: {$requestStatus.errors}</p>
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
