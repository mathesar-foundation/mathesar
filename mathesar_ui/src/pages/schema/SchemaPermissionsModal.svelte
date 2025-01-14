<script lang="ts">
  import { readable } from 'svelte/store';
  import { _ } from 'svelte-i18n';

  import { api } from '@mathesar/api/rpc';
  import type {
    RawSchemaPrivilegesForRole,
    SchemaPrivilege,
  } from '@mathesar/api/rpc/schemas';
  import Identifier from '@mathesar/components/Identifier.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import SeeDocsToLearnMore from '@mathesar/components/SeeDocsToLearnMore.svelte';
  import { DatabaseRouteContext } from '@mathesar/contexts/DatabaseRouteContext';
  import type { Role } from '@mathesar/models/Role';
  import type { Schema } from '@mathesar/models/Schema';
  import AsyncRpcApiStore from '@mathesar/stores/AsyncRpcApiStore';
  import { AsyncStoreValue } from '@mathesar/stores/AsyncStore';
  import { toast } from '@mathesar/stores/toast';
  import {
    type AccessControlConfig,
    PermissionsModal,
    PermissionsOverview,
    TransferOwnership,
  } from '@mathesar/systems/permissions';
  import {
    Help,
    ImmutableMap,
    type ModalController,
  } from '@mathesar-component-library';

  export let controller: ModalController;
  export let schema: Schema;

  $: schemaPrivileges = schema.constructSchemaPrivilegesStore();
  $: schemaName = schema.name;

  const databaseContext = DatabaseRouteContext.get();
  $: ({ roles, currentRole } = $databaseContext);

  const accessControlConfig: AccessControlConfig<
    'read' | 'read_and_create',
    SchemaPrivilege
  > = {
    allPrivileges: [
      {
        id: 'USAGE',
        help: $_('schema_privilege_usage_help'),
      },
      {
        id: 'CREATE',
        help: $_('schema_privilege_create_help'),
      },
    ],
    access: {
      levels: [
        {
          id: 'read',
          privileges: new Set(['USAGE']),
          name: $_('read'),
          help: $_('schema_access_read_help'),
        },
        {
          id: 'read_and_create',
          privileges: new Set(['USAGE', 'CREATE']),
          name: $_('read_and_create'),
          help: $_('schema_access_create_help'),
        },
      ],
      default: 'read',
    },
  };

  function getAsyncStoresForPermissions() {
    void AsyncRpcApiStore.runBatchConservatively([
      schemaPrivileges.batchRunner({
        database_id: schema.database.id,
        schema_oid: schema.oid,
      }),
      roles.batchRunner({ database_id: schema.database.id }),
      currentRole.batchRunner({ database_id: schema.database.id }),
    ]);
    return {
      roles,
      privilegesForRoles: schemaPrivileges,
      permissionsMetaData: readable(
        new AsyncStoreValue<Schema, string>({
          isLoading: false,
          settlement: {
            state: 'resolved',
            value: schema,
          },
        }),
      ),
      currentRole,
    };
  }

  async function savePrivilegesForRoles(
    privileges: RawSchemaPrivilegesForRole[],
  ) {
    const response = await api.schemas.privileges
      .replace_for_roles({
        database_id: schema.database.id,
        schema_oid: schema.oid,
        privileges,
      })
      .run();
    schemaPrivileges.updateResolvedValue(
      () => new ImmutableMap(response.map((pr) => [pr.role_oid, pr])),
    );
    toast.success($_('access_for_roles_saved_successfully'));
  }

  async function transferOwnership(newOwner: Role['oid']) {
    await schema.updateOwner(newOwner);
    toast.success($_('schema_ownership_updated_successfully'));
  }
</script>

<PermissionsModal
  {controller}
  getAsyncStores={getAsyncStoresForPermissions}
  onClose={() => schemaPrivileges.reset()}
>
  <span slot="title">
    <RichText text={$_('permissions_for_named_schema')} let:slotName>
      {#if slotName === 'schemaName'}
        <Identifier>{$schemaName}</Identifier>
      {/if}
    </RichText>
    <Help>
      <p>{$_('schema_permissions_help_1')}</p>
      <p>{$_('schema_permissions_help_2')}</p>
      <p><SeeDocsToLearnMore page="schemaPermissions" /></p>
    </Help>
  </span>
  <PermissionsOverview
    slot="share"
    {controller}
    {accessControlConfig}
    let:storeValues
    {storeValues}
    {savePrivilegesForRoles}
  />
  <TransferOwnership
    slot="transfer-ownership"
    {controller}
    {transferOwnership}
    let:storeValues
    {storeValues}
  />
</PermissionsModal>
