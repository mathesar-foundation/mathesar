<script lang="ts">
  import { _ } from 'svelte-i18n';

  import Icon from '@mathesar/component-library/icon/Icon.svelte';
  import Errors from '@mathesar/components/Errors.svelte';
  import GridTable from '@mathesar/components/grid-table/GridTable.svelte';
  import GridTableCell from '@mathesar/components/grid-table/GridTableCell.svelte';
  import WarningBox from '@mathesar/components/message-boxes/WarningBox.svelte';
  import SeeDocsToLearnMore from '@mathesar/components/SeeDocsToLearnMore.svelte';
  import { DatabaseSettingsRouteContext } from '@mathesar/contexts/DatabaseSettingsRouteContext';
  import { iconAddNew } from '@mathesar/icons';
  import type { Collaborator } from '@mathesar/models/Collaborator';
  import AsyncRpcApiStore from '@mathesar/stores/AsyncRpcApiStore';
  import { modal } from '@mathesar/stores/modal';
  import { fetchSchemasForCurrentDatabase } from '@mathesar/stores/schemas';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import {
    Button,
    Help,
    Spinner,
    isDefinedNonNullable,
  } from '@mathesar-component-library';

  import SettingsContentLayout from '../SettingsContentLayout.svelte';

  import AddCollaboratorModel from './AddCollaboratorModal.svelte';
  import CollaboratorRow from './CollaboratorRow.svelte';
  import EditRoleForCollaboratorModal from './EditRoleForCollaboratorModal.svelte';

  const routeContext = DatabaseSettingsRouteContext.get();
  const addCollaboratorModal = modal.spawnModalController();
  const editCollaboratorRoleModal = modal.spawnModalController();

  const userProfileStore = getUserProfileStoreFromContext();
  $: ({ isMathesarAdmin } = $userProfileStore);

  $: ({
    database,
    configuredRoles,
    collaborators,
    users,
    databaseRouteContext,
  } = $routeContext);

  $: void AsyncRpcApiStore.runBatchConservatively([
    collaborators.batchRunner({ database_id: database.id }),
    configuredRoles.batchRunner({ server_id: database.server.id }),
  ]);
  $: void users.runConservatively();
  $: isLoading =
    $collaborators.isLoading || $configuredRoles.isLoading || $users.isLoading;
  $: isSuccess = $collaborators.isOk && $configuredRoles.isOk && $users.isOk;
  $: errors = [
    $collaborators.error,
    $configuredRoles.error,
    $users.error,
  ].filter((entry): entry is string => isDefinedNonNullable(entry));
  $: collaboratorsList = [...($collaborators.resolvedValue?.values() ?? [])];

  let targetCollaborator: Collaborator | undefined;

  function editRoleForCollaborator(collaborator: Collaborator) {
    targetCollaborator = collaborator;
    editCollaboratorRoleModal.open();
  }

  function checkAndHandleSideEffects(collaborator: Collaborator) {
    if (collaborator.userId === $userProfileStore.id) {
      void AsyncRpcApiStore.runBatch([
        databaseRouteContext.underlyingDatabase.batchRunner({
          database_id: database.id,
        }),
        databaseRouteContext.roles.batchRunner({ database_id: database.id }),
      ]);
      void fetchSchemasForCurrentDatabase();
    }
  }
</script>

<SettingsContentLayout>
  <svelte:fragment slot="title">
    {$_('collaborators')}
    <Help>
      {$_('collaborators_help')}
      <SeeDocsToLearnMore page="collaborators" />
    </Help>
  </svelte:fragment>
  <svelte:fragment slot="actions">
    {#if isSuccess}
      <Button
        appearance="primary"
        on:click={() => addCollaboratorModal.open()}
        disabled={!isMathesarAdmin}
      >
        <Icon {...iconAddNew} />
        <span>{$_('add_collaborator')}</span>
      </Button>
    {/if}
  </svelte:fragment>
  {#if isLoading}
    <Spinner />
  {:else if isSuccess}
    <div class="collaborators-table">
      {#if collaboratorsList.length > 0}
        <GridTable>
          <GridTableCell header>{$_('mathesar_user')}</GridTableCell>
          <GridTableCell header>{$_('role')}</GridTableCell>
          <GridTableCell header>{$_('actions')}</GridTableCell>
          {#each collaboratorsList as collaborator (collaborator.id)}
            <CollaboratorRow
              {database}
              {collaborator}
              onClickEditRole={editRoleForCollaborator}
              onDelete={checkAndHandleSideEffects}
            />
          {/each}
        </GridTable>
      {:else}
        <WarningBox fullWidth>
          {$_('no_collaborators_added')}
        </WarningBox>
      {/if}
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
    onAdd={checkAndHandleSideEffects}
  />
{/if}

{#if $configuredRoles.resolvedValue && $users.resolvedValue && targetCollaborator}
  <EditRoleForCollaboratorModal
    collaborator={targetCollaborator}
    usersMap={$users.resolvedValue}
    controller={editCollaboratorRoleModal}
    configuredRolesMap={$configuredRoles.resolvedValue}
    onUpdateRole={checkAndHandleSideEffects}
  />
{/if}

<style lang="scss">
  .collaborators-table {
    --Grid-table__template-columns: 3fr 3fr 1fr;
    background: var(--white);
  }
</style>
