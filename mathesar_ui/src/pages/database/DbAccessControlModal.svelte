<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { UserRole } from '@mathesar/api/rest/users';
  import type { Database } from '@mathesar/AppTypes';
  import Identifier from '@mathesar/components/Identifier.svelte';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import {
    type UserModel,
    setUsersStoreInContext,
  } from '@mathesar/stores/users';
  import { AccessControlView } from '@mathesar/systems/users-and-permissions';
  import type { ObjectRoleMap } from '@mathesar/utils/permissions';
  import {
    ControlledModal,
    type ModalController,
  } from '@mathesar-component-library';

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
    <RichText text={$_('manage_database_access')} let:slotName>
      {#if slotName === 'databaseName'}
        <Identifier>{database.nickname}</Identifier>
      {/if}
    </RichText>
  </svelte:fragment>

  {#if $requestStatus?.state === 'success'}
    <AccessControlView
      accessControlObject="database"
      usersWithAccess={$usersWithAccess}
      usersWithoutAccess={$usersWithoutAccess}
      {addAccessForUser}
      {removeAccessForUser}
      {getUserRoles}
    />
  {:else if $requestStatus?.state === 'processing'}
    <div>{$_('loading')}</div>
  {:else if $requestStatus?.state === 'failure'}
    <ErrorBox>
      {$requestStatus.errors.join(', ')}
    </ErrorBox>
  {/if}
</ControlledModal>
