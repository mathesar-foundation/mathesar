<script lang="ts">
  import {
    Chip,
    Icon,
    SpinnerButton,
    Button,
  } from '@mathesar-component-library';
  import {
    iconUser,
    iconDeleteMajor,
    iconDatabase,
    iconSchema,
  } from '@mathesar/icons';
  import type { UserModel } from '@mathesar/stores/users';
  import type { UserRole } from '@mathesar/api/users';
  import {
    getDisplayNameForRole,
    type ObjectRoleMap,
  } from '@mathesar/utils/permissions';

  export let userProfile: UserModel | undefined;
  export let userModel: UserModel;
  export let accessControlObject: 'database' | 'schema';
  export let getUserRoles: (user: UserModel) => ObjectRoleMap | undefined;
  export let removeAccessForUser: (user: UserModel) => Promise<void>;

  $: roleMap = getUserRoles(userModel);
  $: roles = roleMap && roleMap.size > 0 ? [...roleMap.entries()] : [];
  $: userRoleRows = (() => {
    const rows: ['admin' | 'database' | 'schema', UserRole][] =
      userModel.isSuperUser ? [['admin', 'manager']] : roles;
    return rows;
  })();

  async function removeAccess() {
    await removeAccessForUser(userModel);
  }
</script>

{#each userRoleRows as [level, role] (`${level}-${role}`)}
  <div
    class="wrapper"
    class:disabled={userRoleRows.length > 1 && accessControlObject !== level}
  >
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
        {#if level === 'admin'}
          <Icon {...iconUser} size="0.8em" />
          <span>Admin</span>
        {:else}
          {#if level === 'database'}
            <Icon {...iconDatabase} size="0.8em" />
          {:else if level === 'schema'}
            <Icon {...iconSchema} size="0.8em" />
          {/if}
          <span>{getDisplayNameForRole(role)}</span>
        {/if}
      </Chip>
    </div>
    <div>
      {#if accessControlObject === level && userProfile?.id !== userModel.id}
        <SpinnerButton
          onClick={removeAccess}
          label=""
          icon={{ ...iconDeleteMajor, size: '0.75em' }}
          appearance="outline-primary"
        />
      {:else}
        <Button disabled>
          <Icon {...iconDeleteMajor} size="0.75em" />
        </Button>
      {/if}
    </div>
  </div>
{/each}

<style lang="scss">
  .wrapper {
    --access-control-row-color: inherit;
    display: contents;
    color: var(--access-control-row-color);

    .name-and-info {
      padding: var(--size-ultra-small) 0;

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
    .access-level {
      padding: 0 0.4rem;
      text-align: right;

      :global(.chip) {
        min-width: 4.15rem;
        justify-content: center;
      }

      :global(.chip + .chip) {
        margin-left: 0.2rem;
      }
    }

    &.disabled {
      --access-control-row-color: var(--color-text-muted);
    }
  }
</style>
