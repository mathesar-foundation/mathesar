<script lang="ts">
  import {
    ControlledModal,
    type ModalController,
  } from '@mathesar-component-library';
  import type { Database } from '@mathesar/AppTypes';
  import Identifier from '@mathesar/components/Identifier.svelte';
  import {
    setUsersStoreInContext,
    type UserModel,
  } from '@mathesar/stores/users';
  import type { UserRole } from '@mathesar/api/users';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import { AccessControlView } from '@mathesar/systems/users-and-permissions';
  import type { ObjectRoleMap } from '@mathesar/utils/permissions';

  export let controller: ModalController;
  export let database: Database;

  const usersStore = setUsersStoreInContext();
  const { requestStatus } = usersStore;

  $: usersWithoutAccess = usersStore.getUsersWithoutAccessToDb(database);
  $: usersWithAccess = usersStore.getUsersWithAccessToDb(database);

  async function addAccessForUser(user: UserModel, role: UserRole) {
    await usersStore.addDatabaseRoleForUser(user.id, database, role);
  }

  async function removeAccessForUser(user: UserModel) {
    await usersStore.removeDatabaseAccessForUser(user.id, database);
  }

  function getUserRoles(user: UserModel): ObjectRoleMap | undefined {
    const dbRole = user.getRoleForDb(database);
    return dbRole ? new Map([['database', dbRole.role]]) : undefined;
  }
</script>

<ControlledModal {controller} closeOn={['button', 'esc', 'overlay']}>
  <svelte:fragment slot="title">
    Manage <Identifier>{database.name}</Identifier> Database Access
  </svelte:fragment>

  {#if $requestStatus?.state === 'success'}
    <AccessControlView
      accessControlObject="database"
      {usersWithAccess}
      {usersWithoutAccess}
      {addAccessForUser}
      {removeAccessForUser}
      {getUserRoles}
    />
  {:else if $requestStatus?.state === 'processing'}
    <div>Loading</div>
  {:else if $requestStatus?.state === 'failure'}
    <ErrorBox>
      {$requestStatus.errors.join(', ')}
    </ErrorBox>
  {/if}
</ControlledModal>
