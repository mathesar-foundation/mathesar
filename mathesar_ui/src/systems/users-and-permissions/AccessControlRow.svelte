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
  $: roles = roleMap && roleMap.size > 0 ? [...roleMap.entries()] : undefined;
  $: userRoleOfAccessControlObject = roleMap?.get(accessControlObject);

  async function removeAccess() {
    await removeAccessForUser(userModel);
  }
</script>

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
  {#if userModel.isSuperUser}
    <Chip background="var(--slate-200)" display="inline-flex">
      <Icon {...iconUser} size="0.8em" />
      <span>Admin</span>
    </Chip>
  {:else if roles}
    {#each roles as [object, role]}
      <Chip
        background={accessControlObject !== object
          ? 'var(--slate-100)'
          : 'var(--slate-200)'}
        display="inline-flex"
      >
        {#if object === 'database'}
          <Icon {...iconDatabase} size="0.8em" />
        {:else if object === 'schema'}
          <Icon {...iconSchema} size="0.8em" />
        {/if}
        <span>{getDisplayNameForRole(role)}</span>
      </Chip>
    {/each}
  {/if}
</div>
<div>
  {#if !userModel.isSuperUser && userRoleOfAccessControlObject !== undefined && userProfile?.id !== userModel.id}
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

<style lang="scss">
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
</style>
