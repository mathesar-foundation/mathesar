<script lang="ts">
  import {
    ControlledModal,
    type ModalController,
  } from '@mathesar-component-library';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import Identifier from '@mathesar/components/Identifier.svelte';
  import {
    setUsersStoreInContext,
    type UserModel,
  } from '@mathesar/stores/users';
  import type { UserRole } from '@mathesar/api/users';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import { AccessControlView } from '@mathesar/systems/users-and-permissions';

  export let controller: ModalController;
  export let database: Database;
  export let schema: SchemaEntry;

  const usersStore = setUsersStoreInContext();
  const { requestStatus } = usersStore;

  $: usersWithoutDirectAccessToSchema =
    usersStore.getNormalUsersWithoutDirectSchemaRole(schema);
  $: usersWithDirectAccessToSchema =
    usersStore.getNormalUsersWithDirectSchemaRole(schema);
  $: usersWithoutAccessToDb = usersStore.getUsersWithoutAccessToDb(database);
  $: usersWithAccessToDb = usersStore.getUsersWithAccessToDb(database);

  async function addAccessForUser(user: UserModel, role: UserRole) {
    await usersStore.addSchemaRoleForUser(user.id, schema, role);
  }

  async function removeAccessForUser(user: UserModel) {
    await usersStore.removeSchemaAccessForUser(user.id, schema);
  }

  function getUserRole(user: UserModel): UserRole | undefined {
    return user.getRoleForSchema(schema)?.role;
  }
</script>

<ControlledModal {controller} closeOn={['button', 'esc', 'overlay']}>
  <svelte:fragment slot="title">
    Manage <Identifier>{schema.name}</Identifier> Schema Access
  </svelte:fragment>

  {#if $requestStatus?.state === 'success'}
    <AccessControlView
      usersWithAccess={usersWithDirectAccessToSchema}
      usersWithoutAccess={usersWithoutDirectAccessToSchema}
      {addAccessForUser}
      {removeAccessForUser}
      {getUserRole}
    />
  {:else if $requestStatus?.state === 'processing'}
    <div>Loading</div>
  {:else if $requestStatus?.state === 'failure'}
    <ErrorBox>
      {$requestStatus.errors.join(', ')}
    </ErrorBox>
  {/if}
</ControlledModal>
