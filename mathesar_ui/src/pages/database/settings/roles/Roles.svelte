<script lang="ts">
  import { get } from 'svelte/store';
  import { _ } from 'svelte-i18n';

  import GridTable from '@mathesar/components/grid-table/GridTable.svelte';
  import GridTableCell from '@mathesar/components/grid-table/GridTableCell.svelte';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import SeeDocsToLearnMore from '@mathesar/components/SeeDocsToLearnMore.svelte';
  import { DatabaseSettingsRouteContext } from '@mathesar/contexts/DatabaseSettingsRouteContext';
  import { staticText } from '@mathesar/i18n/staticText';
  import { iconAddNew } from '@mathesar/icons';
  import type { Role } from '@mathesar/models/Role';
  import AsyncRpcApiStore from '@mathesar/stores/AsyncRpcApiStore';
  import { modal } from '@mathesar/stores/modal';
  import { fetchSchemasForCurrentDatabase } from '@mathesar/stores/schemas';
  import { Button, Help, Icon, Spinner } from '@mathesar-component-library';

  import SettingsContentLayout from '../SettingsContentLayout.svelte';

  import CreateRoleModal from './CreateRoleModal.svelte';
  import ModifyRoleMembers from './ModifyRoleMembers.svelte';
  import RoleRow from './RoleRow.svelte';

  const routeContext = DatabaseSettingsRouteContext.get();
  const createRoleModalController = modal.spawnModalController();
  const modifyRoleMembersModalController = modal.spawnModalController();

  $: ({ databaseRouteContext, configuredRoles, collaborators } = $routeContext);
  $: ({ database, roles, underlyingDatabase, currentRole } =
    databaseRouteContext);

  $: void roles.runConservatively({ database_id: database.id });
  $: roleList = [...($roles.resolvedValue?.values() ?? [])];

  let targetRole: Role | undefined = undefined;

  function modifyMembersForRole(role: Role) {
    targetRole = role;
    modifyRoleMembersModalController.open();
  }

  function handleRoleChangeSideEffects(role: Role) {
    configuredRoles.reset();
    collaborators.reset();

    const currentRoleValue = get(currentRole).resolvedValue;
    const currentRoleInheritsOrIsEditedRole = Boolean(
      currentRoleValue?.currentRoleOid === role.oid ||
        currentRoleValue?.parentRoleOids.has(role.oid),
    );

    if (currentRoleInheritsOrIsEditedRole) {
      void AsyncRpcApiStore.runBatch([
        currentRole.batchRunner({ database_id: database.id }),
        underlyingDatabase.batchRunner({ database_id: database.id }),
      ]);
      void fetchSchemasForCurrentDatabase();
    }
  }
</script>

<SettingsContentLayout>
  <svelte:fragment slot="title">
    {$_('roles')}
    <Help>
      {$_('roles_help')}
      <SeeDocsToLearnMore page="roles" />
    </Help>
  </svelte:fragment>
  <svelte:fragment slot="actions">
    {#if !$roles.isLoading}
      <Button
        appearance="primary"
        on:click={() => createRoleModalController.open()}
      >
        <Icon {...iconAddNew} />
        <span>{$_('create_role')}</span>
      </Button>
    {/if}
  </svelte:fragment>
  {#if $roles.isLoading}
    <Spinner />
  {:else if $roles.isOk && $roles.resolvedValue}
    <div class="roles-table">
      <GridTable>
        <GridTableCell header>{$_('role')}</GridTableCell>
        <GridTableCell header>
          <div>
            {staticText.LOGIN}
            <Help>
              {$_('roles_login_help')}
              <SeeDocsToLearnMore page="rolesLogin" />
            </Help>
          </div>
        </GridTableCell>
        <GridTableCell header>
          <div>
            {$_('child_roles')}
            <Help>
              {$_('role_inheritance_help')}
              <SeeDocsToLearnMore page="rolesInheritance" />
            </Help>
          </div>
        </GridTableCell>
        <GridTableCell header>{$_('actions')}</GridTableCell>
        {#each roleList as role (role.oid)}
          <RoleRow
            {role}
            rolesMap={$roles.resolvedValue}
            onClickEditMembers={modifyMembersForRole}
            onDrop={handleRoleChangeSideEffects}
          />
        {/each}
      </GridTable>
    </div>
  {:else if $roles.error}
    <ErrorBox fullWidth>
      {$roles.error}
    </ErrorBox>
  {/if}
</SettingsContentLayout>

<CreateRoleModal controller={createRoleModalController} />

{#if $roles.resolvedValue && targetRole}
  <ModifyRoleMembers
    parentRole={targetRole}
    rolesMap={$roles.resolvedValue}
    controller={modifyRoleMembersModalController}
    onSave={({ parentRole }) => handleRoleChangeSideEffects(parentRole)}
  />
{/if}

<style lang="scss">
  .roles-table {
    --Grid-table__template-columns: 3fr 2fr 4fr 2fr;
    background: var(--white);
  }
</style>
