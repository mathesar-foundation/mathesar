<script lang="ts">
  import {
    LabeledInput,
    Select,
    SpinnerButton,
  } from '@mathesar-component-library';
  import { iconAddNew } from '@mathesar/icons';
  import type { UserRole } from '@mathesar/api/users';
  import {
    setUsersStoreInContext,
    type UserModel,
  } from '@mathesar/stores/users';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import type { Database } from '@mathesar/AppTypes';
  import { getDisplayNameForRole } from '@mathesar/utils/permissions';
  import AccessControlRow from './AccessControlRow.svelte';

  const usersStore = setUsersStoreInContext();
  const { requestStatus } = usersStore;
  const roles: UserRole[] = ['viewer', 'editor', 'manager'];

  export let database: Database;

  let isRequestInProcess = false;

  $: usersWithoutAccessToDb = usersStore.getUsersWithoutAccessToDb(database);
  $: usersWithAccessToDb = usersStore.getUsersWithAccessToDb(database);

  let user: UserModel | undefined = undefined;
  let role: UserRole = 'viewer';

  async function addAccess() {
    if (user) {
      try {
        isRequestInProcess = true;
        await usersStore.addDatabaseRoleForUser(user.id, database, role);
        user = undefined;
      } finally {
        isRequestInProcess = false;
      }
    }
  }

  async function removeAccessForUser(accessRemovedUser: UserModel) {
    await usersStore.removeDatabaseAccessForUser(
      accessRemovedUser.id,
      database,
    );
  }
</script>

{#if $requestStatus?.state === 'success'}
  <div class="add-user-form">
    <LabeledInput label="User" layout="stacked">
      <Select
        autoSelect="none"
        options={$usersWithoutAccessToDb}
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
      {#each $usersWithAccessToDb as userWithAccess}
        <AccessControlRow
          {database}
          userModel={userWithAccess}
          {removeAccessForUser}
        />
      {/each}
    </div>
  </div>
{:else if $requestStatus?.state === 'processing'}
  <div>Loading</div>
{:else if $requestStatus?.state === 'failure'}
  <ErrorBox>
    {$requestStatus.errors.join(', ')}
  </ErrorBox>
{/if}

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
