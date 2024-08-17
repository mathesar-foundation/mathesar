<script lang="ts">
  import { _ } from 'svelte-i18n';

  import Icon from '@mathesar/component-library/icon/Icon.svelte';
  import GridTable from '@mathesar/components/grid-table/GridTable.svelte';
  import GridTableCell from '@mathesar/components/grid-table/GridTableCell.svelte';
  import { iconDeleteMajor } from '@mathesar/icons';
  import AsyncRpcApiStore from '@mathesar/stores/AsyncRpcApiStore';
  import { Button, Spinner } from '@mathesar-component-library';

  import { getDatabaseSettingsContext } from '../databaseSettingsUtils';
  import SettingsContentLayout from '../SettingsContentLayout.svelte';

  const databaseContext = getDatabaseSettingsContext();
  $: ({ database, roles, collaborators } = $databaseContext);

  $: void AsyncRpcApiStore.runBatched(
    [
      collaborators.batchRunner({ database_id: database.id }),
      roles.batchRunner({ database_id: database.id }),
    ],
    { onlyRunIfNotInitialized: true },
  );
  $: isLoading = $collaborators.isLoading || $roles.isLoading;
</script>

<SettingsContentLayout>
  <svelte:fragment slot="title">
    {$_('collaborators')}
  </svelte:fragment>
  <svelte:fragment slot="actions">
    <Button appearance="primary">
      {$_('add_collaborator')}
    </Button>
  </svelte:fragment>
  {#if isLoading}
    <Spinner />
  {:else if $collaborators.isOk}
    <div class="collaborators-table">
      <GridTable>
        <GridTableCell header>{$_('mathesar_user')}</GridTableCell>
        <GridTableCell header>{$_('role')}</GridTableCell>
        <GridTableCell header>{$_('actions')}</GridTableCell>
        {#each [...($collaborators.resolvedValue?.values() ?? [])] as collaborator (collaborator.id)}
          <GridTableCell>{collaborator.user_id}</GridTableCell>
          <GridTableCell>
            {collaborator.configured_role_id}
          </GridTableCell>
          <GridTableCell>
            <Button appearance="secondary">
              <Icon {...iconDeleteMajor} />
            </Button>
          </GridTableCell>
        {/each}
      </GridTable>
    </div>
  {:else if $roles.error}
    {$roles.error}
  {/if}
</SettingsContentLayout>

<style lang="scss">
  .collaborators-table {
    --Grid-table__template-columns: 3fr 3fr 1fr;
    background: var(--white);
  }
</style>
