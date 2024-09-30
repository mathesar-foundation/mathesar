<script lang="ts">
  import { _ } from 'svelte-i18n';

  import Icon from '@mathesar/component-library/icon/Icon.svelte';
  import Errors from '@mathesar/components/Errors.svelte';
  import GridTable from '@mathesar/components/grid-table/GridTable.svelte';
  import GridTableCell from '@mathesar/components/grid-table/GridTableCell.svelte';
  import { DatabaseSettingsRouteContext } from '@mathesar/contexts/DatabaseSettingsRouteContext';
  import { iconAddNew } from '@mathesar/icons';
  import type { Collaborator } from '@mathesar/models/Collaborator';
  import AsyncRpcApiStore from '@mathesar/stores/AsyncRpcApiStore';
  import { modal } from '@mathesar/stores/modal';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import {
    Button,
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

  $: ({ database, configuredRoles, collaborators, users } = $routeContext);

  $: void AsyncRpcApiStore.runBatched([
    collaborators.batchRunner({ database_id: database.id }),
    configuredRoles.batchRunner({ server_id: database.server.id }),
  ]);
  $: void users.runOptimally();
  $: isLoading =
    $collaborators.isLoading || $configuredRoles.isLoading || $users.isLoading;
  $: isSuccess = $collaborators.isOk && $configuredRoles.isOk && $users.isOk;
  $: errors = [
    $collaborators.error,
    $configuredRoles.error,
    $users.error,
  ].filter((entry): entry is string => isDefinedNonNullable(entry));

  let targetCollaborator: Collaborator | undefined;

  function editRoleForCollaborator(collaborator: Collaborator) {
    targetCollaborator = collaborator;
    editCollaboratorRoleModal.open();
  }
</script>

<SettingsContentLayout>
  <svelte:fragment slot="title">
    {$_('collaborators')}
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
      <GridTable>
        <GridTableCell header>{$_('mathesar_user')}</GridTableCell>
        <GridTableCell header>{$_('role')}</GridTableCell>
        <GridTableCell header>{$_('actions')}</GridTableCell>
        {#each [...($collaborators.resolvedValue?.values() ?? [])] as collaborator (collaborator.id)}
          <CollaboratorRow {collaborator} {editRoleForCollaborator} />
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

{#if $configuredRoles.resolvedValue && $users.resolvedValue && targetCollaborator}
  <EditRoleForCollaboratorModal
    collaborator={targetCollaborator}
    usersMap={$users.resolvedValue}
    controller={editCollaboratorRoleModal}
    configuredRolesMap={$configuredRoles.resolvedValue}
  />
{/if}

<style lang="scss">
  .collaborators-table {
    --Grid-table__template-columns: 3fr 3fr 1fr;
    background: var(--white);
  }
</style>
