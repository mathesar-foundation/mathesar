<script lang="ts">
  import { getEditUsersPageUrl } from '@mathesar/routes/urls';
  import type { UserModel } from '@mathesar/stores/users';
  import { getUserTypeInfoFromUserModel } from '@mathesar/systems/users';
  import { Icon } from '@mathesar-component-library';

  export let user: UserModel;

  $: userTypeInfo = getUserTypeInfoFromUserModel(user);
  $: showUserDetailedInfo = user.email || user.fullName;
</script>

<a class="user-row passthrough" href={getEditUsersPageUrl(user.id)}>
  <div class="user-info">
    <span>{user.username}</span>
    {#if showUserDetailedInfo}
      <div class="user-detailed-info">
        {#if user.fullName}
          <span>{user.fullName}</span>
        {/if}
        {#if user.fullName && user.email}
          <span class="divider" />
        {/if}
        {#if user.email}
          <span>{user.email}</span>
        {/if}
      </div>
    {/if}
  </div>
  <div class="user-type">
    <Icon {...userTypeInfo.icon} size="0.9rem" />
    <span>{userTypeInfo.displayName}</span>
  </div>
</a>

<style lang="scss">
  .user-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--sm1);
    cursor: pointer;
    min-height: 4.2rem;
    transition: background-color 0.2s ease;

    &:hover {
      background: var(--hover-background);
    }
    &:focus {
      background: var(--active-background);
    }
  }

  .user-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .user-detailed-info {
    display: flex;
    align-items: center;
    font-weight: 300;
    color: var(--text-color-secondary);
    gap: 0.5rem;
  }

  .divider {
    display: inline-block;
    width: 0.25rem;
    height: 0.25rem;
    background-color: var(--neutral-500);
    border-radius: 50%;
  }

  .user-type {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: var(--sm1);
    color: var(--text-color-secondary);
    padding: 0.25rem 0.5rem;
    border-radius: var(--border-radius-s);
  }
</style>
