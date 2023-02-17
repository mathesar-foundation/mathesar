<script lang="ts">
  import { Chip, Icon, SpinnerButton } from '@mathesar-component-library';
  import { iconUser, iconDeleteMajor } from '@mathesar/icons';
  import type { UserModel } from '@mathesar/stores/users';
  import type { Database } from '@mathesar/AppTypes';
  import { getDisplayNameForRole } from '@mathesar/utils/permissions';

  export let database: Database;
  export let userModel: UserModel;
  export let removeAccessForUser: (user: UserModel) => Promise<void>;

  $: dbRole = userModel.getRoleForDb(database);
  $: accessDisplayName = dbRole
    ? getDisplayNameForRole(dbRole.role)
    : undefined;

  async function removeAccess() {
    await removeAccessForUser(userModel);
  }
</script>

<div class="user-ac-row">
  <div class="name-and-info">
    <div class="name">{userModel.username}</div>
    <div class="info">
      {#if userModel.fullName}
        <span>{userModel.fullName}</span>
      {/if}
      {#if userModel.fullName && userModel.email}
        <span class="divider" />
      {/if}
      {#if userModel.email}
        <span>{userModel.email}</span>
      {/if}
    </div>
  </div>
  <div class="access-level">
    <Chip background="var(--slate-200)" display="inline-flex">
      <Icon {...iconUser} size="0.8em" />
      <span>
        {#if userModel.isSuperUser}
          Admin
        {:else if dbRole && accessDisplayName}
          {accessDisplayName}
        {/if}
      </span>
    </Chip>
  </div>
  {#if !userModel.isSuperUser}
    <div>
      <SpinnerButton
        onClick={removeAccess}
        label=""
        icon={{ ...iconDeleteMajor, size: '0.75em' }}
        appearance="outline-primary"
      />
    </div>
  {/if}
</div>

<style lang="scss">
  .user-ac-row {
    display: grid;
    grid-template-columns: 6fr 2fr 2.2rem;
    align-items: center;

    .name-and-info {
      .name {
        font-weight: 500;
      }
      .info {
        display: flex;
        align-items: center;
        color: var(--slate-500);

        .divider {
          display: inline-block;
          margin: 0 0.4rem;
          width: 0.25rem;
          height: 0.25rem;
          border-radius: 50%;
          background: var(--slate-800);
        }
      }
    }

    & + :global(.user-ac-row) {
      margin-top: var(--size-base);
    }
  }
</style>
