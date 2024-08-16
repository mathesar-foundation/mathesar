<script lang="ts">
  import { _ } from 'svelte-i18n';

  import GridTable from '@mathesar/components/grid-table/GridTable.svelte';
  import GridTableCell from '@mathesar/components/grid-table/GridTableCell.svelte';
  import AsyncRpcApiStore from '@mathesar/stores/AsyncRpcApiStore';
  import { Button, Spinner } from '@mathesar-component-library';

  import { getDatabaseSettingsContext } from './databaseSettingsUtils';
  import SettingsContentLayout from './SettingsContentLayout.svelte';

  const databaseContext = getDatabaseSettingsContext();
  $: ({ database, configuredRoles, roles, combinedRoles } = $databaseContext);

  $: void AsyncRpcApiStore.runBatched(
    [
      configuredRoles.batchRunner({ server_id: database.server.id }),
      roles.batchRunner({ database_id: database.id }),
    ],
    { onlyRunIfNotInitialized: true },
  );
  $: isLoading = $configuredRoles.isLoading || $roles.isLoading;
</script>

<SettingsContentLayout>
  <svelte:fragment slot="title">
    {$_('role_configuration')}
  </svelte:fragment>
  {#if isLoading}
    <Spinner />
  {:else}
    {#if $combinedRoles.length > 0}
      <div class="role-configuration-table">
        <GridTable>
          <GridTableCell header>{$_('role')}</GridTableCell>
          <GridTableCell header>{$_('actions')}</GridTableCell>

          {#each $combinedRoles as combinedRole (combinedRole.name)}
            <GridTableCell>{combinedRole.name}</GridTableCell>
            <GridTableCell>
              {#if combinedRole.configuredRole}
                <div>
                  <Button appearance="secondary">
                    {$_('configure_password')}
                  </Button>
                  <Button appearance="secondary">
                    {$_('remove')}
                  </Button>
                </div>
              {:else if combinedRole.role}
                <Button appearance="secondary">
                  {$_('configure_in_mathesar')}
                </Button>
              {/if}
            </GridTableCell>
          {/each}
        </GridTable>
      </div>
    {/if}

    {#if $configuredRoles.error}
      {$configuredRoles.error}
    {/if}
    {#if $roles.error}
      {$roles.error}
    {/if}
  {/if}
</SettingsContentLayout>

<style lang="scss">
  .role-configuration-table {
    background: var(--white);
    --Grid-table__template-columns: 3fr 2fr;
  }
</style>
