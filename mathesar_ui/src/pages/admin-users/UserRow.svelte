<script lang="ts">
  import type { User } from '@mathesar/api/users';
  import { Icon } from '@mathesar/component-library';
  import { iconUser } from '@mathesar/icons';
  import { getEditUsersPageUrl } from '@mathesar/routes/urls';

  export let user: User;

  // TODO: Update the icon
  $: userTypeIcon = user.is_superuser ? iconUser : iconUser;
  $: userTypeText = user.is_superuser ? 'Admin' : 'Custom';
  $: showUserDetailedInfo = user.email || user.full_name;
</script>

<a class="user-row passthrough" href={getEditUsersPageUrl(user.id)}>
  <div class="user-info">
    <span>{user.username}</span>
    {#if showUserDetailedInfo}
      <div class="user-detailed-info">
        {#if user.full_name}
          <span>{user.full_name}</span>
        {/if}
        {#if user.full_name && user.email}
          <span class="divider" />
        {/if}
        {#if user.email}
          <span>{user.email}</span>
        {/if}
      </div>
    {/if}
  </div>
  <div class="user-type">
    <Icon class="icon" {...userTypeIcon} />
    <span>{userTypeText}</span>
  </div>
</a>

<style lang="scss">
  .user-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--size-x-small);
    cursor: pointer;
    min-height: 4.2rem;
  }

  .user-info {
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 0.25rem;
    }
  }

  .user-detailed-info {
    display: flex;
    align-items: center;

    font-weight: 300;

    > :global(* + *) {
      margin-left: 0.5rem;
    }
  }

  .divider {
    display: inline-block;
    width: 0.25rem;
    height: 0.25rem;
    background-color: var(--slate-500);
    border-radius: 50%;
  }

  .user-type {
    background-color: var(--slate-200);
    padding: 0.25rem 0.5rem;
    border-radius: 1.17rem;
    font-size: var(--text-size-small);

    :global(.icon) {
      font-size: 0.9em;
    }
  }
</style>
