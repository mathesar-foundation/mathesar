<script lang="ts">
  import { _ } from 'svelte-i18n';

  import EntityContainerWithFilterBar from '@mathesar/components/EntityContainerWithFilterBar.svelte';
  import Errors from '@mathesar/components/errors/Errors.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import { iconAddNew } from '@mathesar/icons';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import { ADMIN_USERS_PAGE_ADD_NEW_URL } from '@mathesar/routes/urls';
  import {
    type UserModel,
    getUsersStoreFromContext,
  } from '@mathesar/stores/users';
  import { AnchorButton, Icon } from '@mathesar-component-library';

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

<svelte:head><title>{makeSimplePageTitle($_('users'))}</title></svelte:head>

<h2>{$_('users')} {userCountText}</h2>

<section class="users-list-container">
  {#if $requestStatus?.state === 'processing'}
    <UserSkeleton />
  {:else if $requestStatus?.state === 'success'}
    <EntityContainerWithFilterBar
      searchPlaceholder={$_('search_users')}
      bind:searchQuery={filterQuery}
      on:clear={handleClearFilterQuery}
    >
      <svelte:fragment slot="action">
        <AnchorButton appearance="primary" href={ADMIN_USERS_PAGE_ADD_NEW_URL}>
          <Icon {...iconAddNew} />
          <span>{$_('add_user')}</span>
        </AnchorButton>
      </svelte:fragment>
      <svelte:fragment slot="resultInfo">
        <p>
          <RichText
            text={$_('users_matching_search', {
              values: { count: filteredUsers.length },
            })}
            let:slotName
          >
            {#if slotName === 'searchValue'}
              <strong>{filterQuery}</strong>
            {/if}
          </RichText>
        </p>
      </svelte:fragment>
      <svelte:fragment slot="content">
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
          <p class="no-users-found-text">{$_('no_users_found')}</p>
        {/if}
      </svelte:fragment>
    </EntityContainerWithFilterBar>
  {:else if $requestStatus?.state === 'failure'}
    <Errors errors={$requestStatus.errors} />
  {/if}
</section>

<style lang="scss">
  .users-list-container {
    display: flex;
    flex-direction: column;
    gap: var(--lg1);
  }

  .users-list {
    border: 1px solid var(--border-color);
    background-color: var(--inset-background-color);
    border-radius: var(--border-radius-m);
    overflow: hidden;

    hr {
      margin: 0;
      border: none;
      border-top: 1px solid var(--border-color);
    }
  }

  .no-users-found-text {
    text-align: center;
    padding: 2rem;
    color: var(--text-color-secondary);
    font-style: italic;
  }
</style>
