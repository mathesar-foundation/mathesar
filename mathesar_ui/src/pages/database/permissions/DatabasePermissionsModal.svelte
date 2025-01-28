<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { api } from '@mathesar/api/rpc';
  import type {
    DatabasePrivilege,
    RawDatabasePrivilegesForRole,
  } from '@mathesar/api/rpc/databases';
  import Identifier from '@mathesar/components/Identifier.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import SeeDocsToLearnMore from '@mathesar/components/SeeDocsToLearnMore.svelte';
  import { DatabaseRouteContext } from '@mathesar/contexts/DatabaseRouteContext';
  import type { Role } from '@mathesar/models/Role';
  import AsyncRpcApiStore from '@mathesar/stores/AsyncRpcApiStore';
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

  const databaseContext = DatabaseRouteContext.get();
  $: ({ database, roles, underlyingDatabase, currentRole } = $databaseContext);
  $: databasePrivileges = database.constructDatabasePrivilegesStore();

  const accessControlConfig: AccessControlConfig<
    'connect' | 'connect_and_create',
    DatabasePrivilege
  > = {
    allPrivileges: [
      {
        id: 'CONNECT',
        help: $_('database_privilege_connect_help'),
      },
      {
        id: 'CREATE',
        help: $_('database_privilege_create_help'),
      },
      {
        id: 'TEMPORARY',
        help: $_('database_privilege_temporary_help'),
      },
    ],
    access: {
      levels: [
        {
          id: 'connect',
          privileges: new Set(['CONNECT']),
          name: $_('connect'),
          help: $_('database_access_connect_help'),
        },
        {
          id: 'connect_and_create',
          privileges: new Set(['CONNECT', 'CREATE']),
          name: $_('connect_and_create'),
          help: $_('database_access_create_help'),
        },
      ],
      default: 'connect',
    },
  };

  function getAsyncStoresForPermissions() {
    void AsyncRpcApiStore.runBatchConservatively([
      databasePrivileges.batchRunner({ database_id: database.id }),
      roles.batchRunner({ database_id: database.id }),
      underlyingDatabase.batchRunner({ database_id: database.id }),
      currentRole.batchRunner({ database_id: database.id }),
    ]);
    return {
      roles,
      privilegesForRoles: databasePrivileges,
      permissionsMetaData: underlyingDatabase,
      currentRole,
    };
  }

  async function savePrivilegesForRoles(
    privileges: RawDatabasePrivilegesForRole[],
  ) {
    const response = await api.databases.privileges
      .replace_for_roles({ database_id: database.id, privileges })
      .run();
    databasePrivileges.updateResolvedValue(
      () => new ImmutableMap(response.map((pr) => [pr.role_oid, pr])),
    );
    toast.success($_('access_for_roles_saved_successfully'));
  }

  async function transferOwnership(newOwner: Role['oid']) {
    if (!$underlyingDatabase.resolvedValue) {
      throw new Error('Database has not been stored');
    }
    await $underlyingDatabase.resolvedValue.updateOwner(newOwner);
    toast.success($_('database_ownership_updated_successfully'));
  }
</script>

<PermissionsModal
  {controller}
  getAsyncStores={getAsyncStoresForPermissions}
  onClose={() => databasePrivileges.reset()}
>
  <span slot="title">
    <RichText text={$_('permissions_for_named_database')} let:slotName>
      {#if slotName === 'databaseName'}
        <Identifier>{database.name}</Identifier>
      {/if}
    </RichText>
    <Help>
      <p>{$_('database_permissions_help_1')}</p>
      <p>{$_('database_permissions_help_2')}</p>
      <p><SeeDocsToLearnMore page="databasePermissions" /></p>
      <p>
        <RichText text={$_('database_permissions_help_3')} let:slotName>
          {#if slotName === 'databaseSettings'}
            {$_('database_settings')}
          {/if}
        </RichText>
      </p>
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
