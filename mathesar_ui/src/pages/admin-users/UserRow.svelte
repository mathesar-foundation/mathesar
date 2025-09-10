<script lang="ts">
  import EntityListItem from '@mathesar/components/EntityListItem.svelte';
  import { getEditUsersPageUrl } from '@mathesar/routes/urls';
  import type { UserModel } from '@mathesar/stores/users';
  import { getUserTypeInfoFromUserModel } from '@mathesar/systems/users';

  export let user: UserModel;

  $: userTypeInfo = getUserTypeInfoFromUserModel(user);
</script>

<EntityListItem
  href={getEditUsersPageUrl(user.id)}
  primary
  name={user.username}
  icon={userTypeInfo.icon}
>
  <svelte:fragment slot="detail">
    <div class="user-detailed-info">
      {#if user.fullName}
        <span>{user.fullName}</span>
        <span class="divider" />
      {/if}
      {#if user.email}
        <span>{user.email}</span>
        <span class="divider" />
      {/if}
      <span>{userTypeInfo.displayName}</span>
    </div>
  </svelte:fragment>
</EntityListItem>

<style lang="scss">
  .user-detailed-info {
    display: flex;
    align-items: center;
    font-weight: var(--font-weight-light);
    color: var(--text-secondary);
    gap: var(--sm1);
  }

  .divider {
    display: inline-block;
    width: 0.25rem;
    height: 0.25rem;
    background-color: var(--color-border-row);
    border-radius: 50%;
  }
</style>
