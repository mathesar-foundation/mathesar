<script lang="ts">
  import type { ModalController } from '@mathesar-component-library';
  import {
    Icon,
    ControlledModal,
    DropdownMenu,
    MenuItem,
    iconLoading,
  } from '@mathesar-component-library';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import type {
    Constraint,
    ConstraintsDataStore,
  } from '@mathesar/stores/table-data/types';
  import { States } from '@mathesar/utils/api';
  import { modal } from '@mathesar/stores/modal';
  import {
    iconAddNew,
    iconTableLink,
    iconConstraintUnique,
  } from '@mathesar/icons';
  import NewUniqueConstraintModal from './NewUniqueConstraintModal.svelte';
  import TableConstraint from './TableConstraint.svelte';
  import ConstraintHelp from './__help__/ConstraintHelp.svelte';
  import NewFkConstraintModal from './NewFkConstraintModal.svelte';

  export let controller: ModalController;

  const tabularData = getTabularDataStoreFromContext();
  const newUniqueConstraintModal = modal.spawnModalController();
  const newFkConstraintModal = modal.spawnModalController();

  $: constraintsDataStore = $tabularData.constraintsDataStore;
  $: state = $constraintsDataStore.state;
  $: errorMsg = $constraintsDataStore.error;
  $: constraints = $constraintsDataStore.constraints;
  $: isEmpty = constraints.length === 0;
  $: isLoading = state === States.Idle || state === States.Loading;
  // Only show the spinner during the _initial_ loading event. Hide it for
  // subsequent updates so that we can rely on the spinner used on the button
  // for the more specific update.
  $: shouldShowLoadingSpinner = isEmpty && isLoading;
  $: countText = isEmpty ? '' : ` (${constraints.length as number})`;

  function remove(constraint: Constraint) {
    return (constraintsDataStore as ConstraintsDataStore).remove(constraint.id);
  }
</script>

<ControlledModal {controller}>
  <span slot="title">Table Constraints{countText} <ConstraintHelp /></span>
  <div class="table-constraints">
    {#if shouldShowLoadingSpinner}
      <Icon {...iconLoading} />
    {:else if state === States.Error}
      <div>Unable to fetch table constraints</div>
      <div>{errorMsg}</div>
    {:else if isEmpty}
      <div>No constraints</div>
    {:else}
      <div class="constraints-list">
        {#each constraints as constraint (constraint.id)}
          <TableConstraint {constraint} drop={() => remove(constraint)} />
        {/each}
      </div>
    {/if}
  </div>

  <div slot="footer" class="footer">
    <DropdownMenu label="New Constraint" icon={iconAddNew}>
      <MenuItem
        on:click={() => newUniqueConstraintModal.open()}
        icon={iconConstraintUnique}
      >
        Unique
      </MenuItem>
      <MenuItem
        on:click={() => newFkConstraintModal.open()}
        icon={iconTableLink}
      >
        Foreign Key
      </MenuItem>
    </DropdownMenu>
  </div>

  <NewUniqueConstraintModal controller={newUniqueConstraintModal} />
  <NewFkConstraintModal controller={newFkConstraintModal} />
</ControlledModal>

<style>
  .constraints-list {
    border: solid #ccc 1px;
    border-radius: 4px;
  }
  .footer {
    text-align: right;
  }
</style>
