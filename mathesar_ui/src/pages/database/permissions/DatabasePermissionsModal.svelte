<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { allDatabasePrivileges } from '@mathesar/api/rpc/databases';
  import { DatabaseRouteContext } from '@mathesar/contexts/DatabaseRouteContext';
  import AsyncRpcApiStore from '@mathesar/stores/AsyncRpcApiStore';
  import PermissionsModal from '@mathesar/systems/permissions/PermissionsModal.svelte';
  import PrivilegesSection from '@mathesar/systems/permissions/PrivilegesSection.svelte';
  import TransferOwnershipSection from '@mathesar/systems/permissions/TransferOwnershipSection.svelte';
  import type { ModalController } from '@mathesar-component-library';

  export let controller: ModalController;

  const databaseContext = DatabaseRouteContext.get();
  $: ({ database, roles, underlyingDatabase } = $databaseContext);
  $: databasePrivileges = database.constructDatabasePrivilegesStore();

  function getAsyncStores() {
    void AsyncRpcApiStore.runBatched([
      databasePrivileges.batchRunner({ database_id: database.id }),
      roles.batchRunner({ database_id: database.id }),
      underlyingDatabase.batchRunner({ database_id: database.id }),
    ]);
    return {
      roles,
      objectPrivileges: databasePrivileges,
      objectOwnerAndCurrentRolePrivileges: underlyingDatabase,
    };
  }

  function savePermissions() {}
</script>

<PermissionsModal {controller} onClose={() => databasePrivileges.reset()}>
  <span slot="title">
    {$_('database_permissions')}
  </span>
  <PrivilegesSection
    slot="privileges"
    {controller}
    accessLevelConfig={[
      { id: 'connect', privileges: new Set(['CONNECT']) },
      { id: 'connect_and_create', privileges: new Set(['CONNECT', 'CREATE']) },
    ]}
    allPrivileges={[...allDatabasePrivileges]}
    {getAsyncStores}
    {savePermissions}
  />
  <TransferOwnershipSection slot="transfer-ownership" {controller} />
</PermissionsModal>
