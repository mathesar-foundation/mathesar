<script lang="ts">
  import { _ } from 'svelte-i18n';

  import GridTable from '@mathesar/components/grid-table/GridTable.svelte';
  import GridTableCell from '@mathesar/components/grid-table/GridTableCell.svelte';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import { DatabaseSettingsRouteContext } from '@mathesar/contexts/DatabaseSettingsRouteContext';
  import { iconAddNew } from '@mathesar/icons';
  import type { Role } from '@mathesar/models/Role';
  import { modal } from '@mathesar/stores/modal';
  import { Button, Icon, Spinner } from '@mathesar-component-library';

  import SettingsContentLayout from '../SettingsContentLayout.svelte';

  import CreateRoleModal from './CreateRoleModal.svelte';
  import ModifyRoleMembers from './ModifyRoleMembers.svelte';
  import RoleRow from './RoleRow.svelte';

  const routeContext = DatabaseSettingsRouteContext.get();
  const createRoleModalController = modal.spawnModalController();
  const modifyRoleMembersModalController = modal.spawnModalController();

  $: ({ database, roles } = $routeContext.databaseRouteContext);

  $: void roles.runIfNotInitialized({ database_id: database.id });
  $: roleList = [...($roles.resolvedValue?.values() ?? [])];

  let targetRole: Role | undefined = undefined;

  function modifyMembersForRole(role: Role) {
    targetRole = role;
    modifyRoleMembersModalController.open();
  }
</script>

<SettingsContentLayout>
  <svelte:fragment slot="title">
    {$_('roles')}
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
        <!--eslint-disable-next-line @intlify/svelte/no-raw-text -->
        <GridTableCell header>LOGIN</GridTableCell>
        <GridTableCell header>
          {$_('child_roles')}
        </GridTableCell>
        <GridTableCell header>{$_('actions')}</GridTableCell>
        {#each roleList as role (role.oid)}
          <RoleRow
            {role}
            rolesMap={$roles.resolvedValue}
            {modifyMembersForRole}
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
  />
{/if}

<style lang="scss">
  .roles-table {
    --Grid-table__template-columns: 3fr 2fr 4fr 2fr;
    background: var(--white);
  }
</style>
