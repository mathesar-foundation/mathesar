<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { api } from '@mathesar/api/rpc';
  import type {
    DatabasePrivilege,
    RawDatabasePrivilegesForRole,
  } from '@mathesar/api/rpc/databases';
  import { DatabaseRouteContext } from '@mathesar/contexts/DatabaseRouteContext';
  import AsyncRpcApiStore from '@mathesar/stores/AsyncRpcApiStore';
  import { toast } from '@mathesar/stores/toast';
  import {
    type AccessControlConfig,
    PermissionsModal,
    PermissionsOverview,
    TransferOwnership,
  } from '@mathesar/systems/permissions';
  import {
    ImmutableMap,
    type ModalController,
  } from '@mathesar-component-library';

  export let controller: ModalController;

  const databaseContext = DatabaseRouteContext.get();
  $: ({ database, roles, underlyingDatabase } = $databaseContext);
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
          name: $_('create'),
          help: $_('database_access_create_help'),
        },
      ],
      default: 'connect',
    },
  };

  function getAsyncStoresForPermissions() {
    void AsyncRpcApiStore.runBatched([
      databasePrivileges.batchRunner({ database_id: database.id }),
      roles.batchRunner({ database_id: database.id }),
      underlyingDatabase.batchRunner({ database_id: database.id }),
    ]);
    return {
      roles,
      privilegesForRoles: databasePrivileges,
      permissionsMetaData: underlyingDatabase,
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
</script>

<PermissionsModal {controller} onClose={() => databasePrivileges.reset()}>
  <span slot="title">
    {$_('database_permissions')}
  </span>
  <PermissionsOverview
    slot="share"
    {controller}
    {accessControlConfig}
    getAsyncStores={getAsyncStoresForPermissions}
    {savePrivilegesForRoles}
  />
  <TransferOwnership slot="transfer-ownership" {controller} />
</PermissionsModal>
