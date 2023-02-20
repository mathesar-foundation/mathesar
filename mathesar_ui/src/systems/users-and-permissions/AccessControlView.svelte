<script lang="ts">
  import type { Readable } from 'svelte/store';
  import {
    LabeledInput,
    Select,
    SpinnerButton,
  } from '@mathesar-component-library';
  import { iconAddNew } from '@mathesar/icons';
  import type { UserRole } from '@mathesar/api/users';
  import {
    getDisplayNameForRole,
    type ObjectRoleMap,
  } from '@mathesar/utils/permissions';
  import type { UserModel } from '@mathesar/stores/users';
  import AccessControlRow from './AccessControlRow.svelte';

  const roles: UserRole[] = ['viewer', 'editor', 'manager'];

  export let usersWithAccess: Readable<UserModel[]>;
  export let usersWithoutAccess: Readable<UserModel[]>;
  export let addAccessForUser: (
    user: UserModel,
    role: UserRole,
  ) => Promise<void>;
  export let removeAccessForUser: (user: UserModel) => Promise<void>;
  export let accessControlObject: 'database' | 'schema';
  export let getUserRoles: (user: UserModel) => ObjectRoleMap | undefined;

  let isRequestInProcess = false;

  let user: UserModel | undefined = undefined;
  let role: UserRole = 'viewer';

  async function addAccess() {
    if (user) {
      try {
        isRequestInProcess = true;
        await addAccessForUser(user, role);
        user = undefined;
      } finally {
        isRequestInProcess = false;
      }
    }
  }
</script>

<div class="add-user-form">
  <LabeledInput label="User" layout="stacked">
    <Select
      autoSelect="none"
      options={$usersWithoutAccess}
      bind:value={user}
      getLabel={(option) => option?.username ?? 'Select User'}
      disabled={isRequestInProcess}
    />
  </LabeledInput>
  <LabeledInput label="Permission" layout="stacked">
    <Select
      options={roles}
      bind:value={role}
      getLabel={(option) =>
        option ? getDisplayNameForRole(option) : 'Select Permission'}
      disabled={isRequestInProcess}
    />
  </LabeledInput>
  <div class="add-button">
    <SpinnerButton
      disabled={!user || isRequestInProcess}
      onClick={addAccess}
      icon={iconAddNew}
      label="Add"
      appearance="secondary"
    />
  </div>
</div>
<div class="users-with-access">
  <div class="header">Users with access</div>
  <div class="list">
    {#each $usersWithAccess as userWithAccess}
      <AccessControlRow
        {getUserRoles}
        userModel={userWithAccess}
        {accessControlObject}
        {removeAccessForUser}
      />
    {/each}
  </div>
</div>

<style lang="scss">
  .add-user-form {
    display: grid;
    grid-template-columns: 4fr 3fr 1fr;
    grid-gap: 0.5rem;
    padding: var(--size-x-small);
    border: 1px solid var(--slate-300);
    border-radius: var(--border-radius-m);

    .add-button {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
    }
  }
  .users-with-access {
    margin-top: var(--size-large);

    .header {
      font-weight: 500;
    }
    .list {
      margin-top: var(--size-base);
    }
  }
</style>
