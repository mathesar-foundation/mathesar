<script lang="ts">
  import { _ } from 'svelte-i18n';

  import GridTable from '@mathesar/components/grid-table/GridTable.svelte';
  import GridTableCell from '@mathesar/components/grid-table/GridTableCell.svelte';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import { Button, Spinner } from '@mathesar-component-library';

  import { getDatabaseSettingsContext } from './databaseSettingsUtils';
  import SettingsContentLayout from './SettingsContentLayout.svelte';

  const databaseContext = getDatabaseSettingsContext();
  $: ({ database, roles } = $databaseContext);

  $: void roles.runIfNotInitialized({ database_id: database.id });
  $: roleList = [...($roles.resolvedValue?.values() ?? [])];
</script>

<SettingsContentLayout>
  <svelte:fragment slot="title">
    {$_('roles')}
  </svelte:fragment>
  <svelte:fragment slot="actions">
    <Button appearance="primary">
      {$_('create_role')}
    </Button>
  </svelte:fragment>
  {#if $roles.isLoading}
    <Spinner />
  {:else if $roles.isOk}
    <div class="roles-table">
      <GridTable>
        <GridTableCell header>{$_('role')}</GridTableCell>
        <!--eslint-disable-next-line @intlify/svelte/no-raw-text -->
        <GridTableCell header>LOGIN</GridTableCell>
        <GridTableCell header>
          {$_('child_roles')}
        </GridTableCell>
        <GridTableCell header>{$_('actions')}</GridTableCell>
        {#each roleList as role (role.name)}
          <GridTableCell>{role.name}</GridTableCell>
          <GridTableCell>
            {role.login ? $_('yes') : $_('no')}
          </GridTableCell>
          <GridTableCell>
            {#each role.members ?? [] as member (member.oid)}
              {member.oid}
            {/each}
          </GridTableCell>
          <GridTableCell>
            <Button appearance="outline-primary">
              {$_('drop_role')}
            </Button>
          </GridTableCell>
        {/each}
      </GridTable>
    </div>
  {:else if $roles.error}
    <ErrorBox fullWidth>
      {$roles.error}
    </ErrorBox>
  {/if}
</SettingsContentLayout>

<style lang="scss">
  .roles-table {
    --Grid-table__template-columns: 3fr 2fr 3fr 2fr;
    background: var(--white);
  }
</style>
