<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { UserRole } from '@mathesar/api/rest/users';
  import type { Schema } from '@mathesar/api/rpc/schemas';
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
  export let schema: Schema;

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

<ControlledModal
  {controller}
  size="medium"
  closeOn={['button', 'esc', 'overlay']}
>
  <svelte:fragment slot="title">
    <RichText text={$_('manage_schema_access')} let:slotName>
      {#if slotName === 'databaseName'}
        <Identifier>{schema.name}</Identifier>
      {/if}
    </RichText>
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
    <div>{$_('loading')}</div>
  {:else if $requestStatus?.state === 'failure'}
    <ErrorBox>
      {$requestStatus.errors.join(', ')}
    </ErrorBox>
  {/if}
</ControlledModal>
