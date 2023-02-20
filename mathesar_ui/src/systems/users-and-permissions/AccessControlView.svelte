<script lang="ts">
  import type { Readable } from 'svelte/store';
  import {
    LabeledInput,
    Select,
    SpinnerButton,
    Button,
    Icon,
  } from '@mathesar-component-library';
  import { iconAddNew } from '@mathesar/icons';
  import type { UserRole } from '@mathesar/api/users';
  import {
    getDisplayNameForRole,
    type ObjectRoleMap,
  } from '@mathesar/utils/permissions';
  import type { UserModel } from '@mathesar/stores/users';
  import { getErrorMessage } from '@mathesar/utils/errors';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
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
  let showAddForm = false;
  let error: string | undefined;

  let user: UserModel | undefined = undefined;
  let role: UserRole = 'viewer';

  async function addAccess() {
    error = undefined;
    if (user) {
      try {
        isRequestInProcess = true;
        await addAccessForUser(user, role);
        user = undefined;
      } catch (err) {
        error = getErrorMessage(err);
      } finally {
        isRequestInProcess = false;
      }
    }
  }
</script>

<div>
  {#if !showAddForm}
    <Button
      appearance="secondary"
      on:click={() => {
        showAddForm = true;
        error = undefined;
      }}
    >
      <Icon {...iconAddNew} />
      <span>Add</span>
    </Button>
  {/if}

  {#if showAddForm}
    <div class="add-user">
      <div class="add-user-form">
        <LabeledInput label="User" layout="stacked">
          <Select
            autoSelect="none"
            options={$usersWithoutAccess}
            bind:value={user}
            disabled={isRequestInProcess}
            let:option
          >
            {#if option}
              {option.username}
            {:else}
              <span class="placeholder">Select User</span>
            {/if}
            <div class="no-users" slot="empty">No users found</div>
          </Select>
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

      {#if error}
        <ErrorBox>{error}</ErrorBox>
      {/if}
    </div>
  {/if}
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
  .add-user {
    padding: var(--size-x-small);
    border: 1px solid var(--slate-300);
    border-radius: var(--border-radius-m);

    .add-user-form {
      display: grid;
      grid-template-columns: 4fr 3fr 1fr;
      grid-gap: 0.5rem;

      .placeholder {
        color: var(--slate-600);
      }

      .add-button {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-end;
      }
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
  .no-users {
    padding: var(--size-xx-small);
  }
</style>
