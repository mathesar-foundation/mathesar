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
  import type { ObjectRoleMap } from '@mathesar/utils/permissions';

  export let controller: ModalController;
  export let database: Database;
  export let schema: SchemaEntry;

  const usersStore = setUsersStoreInContext();
  const { requestStatus } = usersStore;

  $: usersWithoutDirectAccessToSchema =
    usersStore.getNormalUsersWithoutDirectSchemaRole(schema);
  $: usersWithAccessToSchema = usersStore.getUsersWithAccessToSchema(
    database,
    schema,
  );

  async function addAccessForUser(user: UserModel, role: UserRole) {
    await usersStore.addSchemaRoleForUser(user.id, schema, role);
  }

  async function removeAccessForUser(user: UserModel) {
    await usersStore.removeSchemaAccessForUser(user.id, schema);
  }

  function getUserRoles(user: UserModel): ObjectRoleMap | undefined {
    const objectRoleMap: ObjectRoleMap = new Map();
    const dbRole = user.getRoleForDb(database);
    if (dbRole) {
      objectRoleMap.set('database', dbRole.role);
    }
    const schemaRole = user.getRoleForSchema(schema);
    if (schemaRole) {
      objectRoleMap.set('schema', schemaRole.role);
    }
    return objectRoleMap.size ? objectRoleMap : undefined;
  }
</script>

<ControlledModal {controller} closeOn={['button', 'esc', 'overlay']}>
  <svelte:fragment slot="title">
    Manage <Identifier>{schema.name}</Identifier> Schema Access
  </svelte:fragment>

  {#if $requestStatus?.state === 'success'}
    <AccessControlView
      accessControlObject="schema"
      usersWithAccess={$usersWithAccessToSchema}
      usersWithoutAccess={$usersWithoutDirectAccessToSchema}
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
