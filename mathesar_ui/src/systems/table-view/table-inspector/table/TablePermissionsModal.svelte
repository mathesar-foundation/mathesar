<script lang="ts">
  import { readable } from 'svelte/store';
  import { _ } from 'svelte-i18n';

  import { api } from '@mathesar/api/rpc';
  import type {
    RawTablePrivilegesForRole,
    TablePrivilege,
  } from '@mathesar/api/rpc/tables';
  import Identifier from '@mathesar/components/Identifier.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import SeeDocsToLearnMore from '@mathesar/components/SeeDocsToLearnMore.svelte';
  import { DatabaseRouteContext } from '@mathesar/contexts/DatabaseRouteContext';
  import type { Role } from '@mathesar/models/Role';
  import type { Table } from '@mathesar/models/Table';
  import type { RpcError } from '@mathesar/packages/json-rpc-client-builder';
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
  export let table: Table;
  $: tablePrivileges = table.constructTablePrivilegesStore();
  const databaseContext = DatabaseRouteContext.get();
  $: ({ roles, currentRole } = $databaseContext);

  const accessControlConfig: AccessControlConfig<
    'read' | 'write',
    TablePrivilege
  > = {
    allPrivileges: [
      {
        id: 'SELECT',
        help: $_('table_privilege_select_help'),
      },
      {
        id: 'INSERT',
        help: $_('table_privilege_insert_help'),
      },
      {
        id: 'UPDATE',
        help: $_('table_privilege_update_help'),
      },
      {
        id: 'DELETE',
        help: $_('table_privilege_delete_help'),
      },
      {
        id: 'TRUNCATE',
        help: $_('table_privilege_truncate_help'),
      },
      {
        id: 'REFERENCES',
        help: $_('table_privilege_references_help'),
      },
      {
        id: 'TRIGGER',
        help: $_('table_privilege_trigger_help'),
      },
    ],
    access: {
      levels: [
        {
          id: 'read',
          privileges: new Set(['SELECT']),
          name: $_('read'),
          help: $_('table_access_read_help'),
        },
        {
          id: 'write',
          privileges: new Set(['SELECT', 'INSERT', 'UPDATE', 'DELETE']),
          name: $_('write'),
          help: $_('table_access_write_help'),
        },
      ],
      default: 'read',
    },
  };

  function getAsyncStoresForPermissions() {
    void AsyncRpcApiStore.runBatchConservatively([
      tablePrivileges.batchRunner({
        database_id: table.schema.database.id,
        table_oid: table.oid,
      }),
      roles.batchRunner(),
      currentRole.batchRunner(),
    ]);
    return {
      roles,
      privilegesForRoles: tablePrivileges,
      permissionsMetaData: readable(
        new AsyncStoreValue<Table, RpcError>({
          isLoading: false,
          settlement: {
            state: 'resolved',
            value: table,
          },
        }),
      ),
      currentRole,
    };
  }

  async function savePrivilegesForRoles(
    privileges: RawTablePrivilegesForRole[],
  ) {
    const response = await api.tables.privileges
      .replace_for_roles({
        database_id: table.schema.database.id,
        table_oid: table.oid,
        privileges,
      })
      .run();
    tablePrivileges.updateResolvedValue(
      () => new ImmutableMap(response.map((pr) => [pr.role_oid, pr])),
    );
    toast.success($_('access_for_roles_saved_successfully'));
  }

  async function transferOwnership(newOwner: Role['oid']) {
    await table.updateOwner(newOwner);
    toast.success($_('table_ownership_updated_successfully'));
  }
</script>

<PermissionsModal
  {controller}
  getAsyncStores={getAsyncStoresForPermissions}
  onClose={() => tablePrivileges.reset()}
>
  <span slot="title">
    <RichText text={$_('permissions_for_named_table')} let:slotName>
      {#if slotName === 'tableName'}
        <Identifier>{table.name}</Identifier>
      {/if}
    </RichText>
    <Help>
      <p>{$_('table_permissions_help')}</p>
      <p><SeeDocsToLearnMore page="tablePermissions" /></p>
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
