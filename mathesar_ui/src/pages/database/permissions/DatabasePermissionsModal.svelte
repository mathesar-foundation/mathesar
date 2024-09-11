<script lang="ts">
  import { _ } from 'svelte-i18n';

  import {
    type DatabasePrivilege,
    type RawDatabasePrivilegesForRole,
    allDatabasePrivileges,
  } from '@mathesar/api/rpc/databases';
  import { DatabaseRouteContext } from '@mathesar/contexts/DatabaseRouteContext';
  import AsyncRpcApiStore from '@mathesar/stores/AsyncRpcApiStore';
  import {
    type AccessControlConfig,
    PermissionsModal,
    PermissionsOverview,
    TransferOwnership,
  } from '@mathesar/systems/permissions';
  import type { ModalController } from '@mathesar-component-library';

  export let controller: ModalController;

  const databaseContext = DatabaseRouteContext.get();
  $: ({ database, roles, underlyingDatabase } = $databaseContext);
  $: databasePrivileges = database.constructDatabasePrivilegesStore();

  const accessControlConfig: AccessControlConfig<
    'connect' | 'connect_and_create',
    DatabasePrivilege
  > = {
    allPrivileges: allDatabasePrivileges,
    access: {
      levels: [
        { id: 'connect', privileges: new Set(['CONNECT']) },
        {
          id: 'connect_and_create',
          privileges: new Set(['CONNECT', 'CREATE']),
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
    //
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
