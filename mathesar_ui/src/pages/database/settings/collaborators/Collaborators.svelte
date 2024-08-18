<script lang="ts">
  import { _ } from 'svelte-i18n';

  import Icon from '@mathesar/component-library/icon/Icon.svelte';
  import Errors from '@mathesar/components/Errors.svelte';
  import GridTable from '@mathesar/components/grid-table/GridTable.svelte';
  import GridTableCell from '@mathesar/components/grid-table/GridTableCell.svelte';
  import { iconAddNew } from '@mathesar/icons';
  import AsyncRpcApiStore from '@mathesar/stores/AsyncRpcApiStore';
  import { modal } from '@mathesar/stores/modal';
  import { isDefined } from '@mathesar/utils/language';
  import { Button, Spinner } from '@mathesar-component-library';

  import { getDatabaseSettingsContext } from '../databaseSettingsUtils';
  import SettingsContentLayout from '../SettingsContentLayout.svelte';

  import AddCollaboratorModel from './AddCollaboratorModal.svelte';
  import CollaboratorRow from './CollaboratorRow.svelte';

  const databaseContext = getDatabaseSettingsContext();
  const addCollaboratorModal = modal.spawnModalController();

  $: ({ database, configuredRoles, collaborators, users } = $databaseContext);

  $: void AsyncRpcApiStore.runBatched(
    [
      collaborators.batchRunner({ database_id: database.id }),
      configuredRoles.batchRunner({ server_id: database.server.id }),
    ],
    { onlyRunIfNotInitialized: true },
  );
  $: void users.runIfNotInitialized();
  $: isLoading =
    $collaborators.isLoading || $configuredRoles.isLoading || $users.isLoading;
  $: isSuccess = $collaborators.isOk && $configuredRoles.isOk && $users.isOk;
  $: errors = [
    $collaborators.error,
    $configuredRoles.error,
    $users.error,
  ].filter((entry): entry is string => isDefined(entry));
</script>

<SettingsContentLayout>
  <svelte:fragment slot="title">
    {$_('collaborators')}
  </svelte:fragment>
  <svelte:fragment slot="actions">
    {#if isSuccess}
      <Button appearance="primary" on:click={() => addCollaboratorModal.open()}>
        <Icon {...iconAddNew} />
        <span>{$_('add_collaborator')}</span>
      </Button>
    {/if}
  </svelte:fragment>
  {#if isLoading}
    <Spinner />
  {:else if isSuccess}
    <div class="collaborators-table">
      <GridTable>
        <GridTableCell header>{$_('mathesar_user')}</GridTableCell>
        <GridTableCell header>{$_('role')}</GridTableCell>
        <GridTableCell header>{$_('actions')}</GridTableCell>
        {#each [...($collaborators.resolvedValue?.values() ?? [])] as collaborator (collaborator.id)}
          <CollaboratorRow {collaborator} />
        {/each}
      </GridTable>
    </div>
  {:else}
    <Errors {errors} />
  {/if}
</SettingsContentLayout>

{#if $users.resolvedValue && $configuredRoles.resolvedValue && $collaborators.resolvedValue}
  <AddCollaboratorModel
    controller={addCollaboratorModal}
    usersMap={$users.resolvedValue}
    configuredRolesMap={$configuredRoles.resolvedValue}
    collaboratorsMap={$collaborators.resolvedValue}
  />
{/if}

<style lang="scss">
  .collaborators-table {
    --Grid-table__template-columns: 3fr 3fr 1fr;
    background: var(--white);
  }
</style>
