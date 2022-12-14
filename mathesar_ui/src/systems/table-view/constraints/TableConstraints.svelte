<script lang="ts">
  import {
    Icon,
    DropdownMenu,
    ButtonMenuItem,
    iconLoading,
  } from '@mathesar-component-library';
  import {
    getTabularDataStoreFromContext,
    type Constraint,
    type ConstraintsDataStore,
  } from '@mathesar/stores/table-data';
  import { States } from '@mathesar/api/utils/requestUtils';
  import { modal } from '@mathesar/stores/modal';
  import {
    iconAddNew,
    iconTableLink,
    iconConstraintUnique,
  } from '@mathesar/icons';
  import NewUniqueConstraintModal from './NewUniqueConstraintModal.svelte';
  import TableConstraint from './TableConstraint.svelte';
  import NewFkConstraintModal from './NewFkConstraintModal.svelte';
  import ConstraintTypeSection from './ConstraintTypeSection.svelte';
  import type { ConstraintType } from '@mathesar/api/types/tables/constraints';

  const tabularData = getTabularDataStoreFromContext();
  const newUniqueConstraintModal = modal.spawnModalController();
  const newFkConstraintModal = modal.spawnModalController();

  $: constraintsDataStore = $tabularData.constraintsDataStore;
  $: state = $constraintsDataStore.state;
  $: errorMsg = $constraintsDataStore.error;
  $: constraints = $constraintsDataStore.constraints;

  $: constraintsGroupedByType = constraints.reduce(
    (groupedConstraints, constraint) => {
      const alreadyExistingConstraints = groupedConstraints.get(
        constraint.type,
      );
      if (Array.isArray(alreadyExistingConstraints)) {
        groupedConstraints.set(constraint.type, [
          ...alreadyExistingConstraints,
          constraint,
        ]);
        return groupedConstraints;
      } else {
        groupedConstraints.set(constraint.type, [constraint]);
        return groupedConstraints;
      }
    },
    new Map<ConstraintType, Constraint[]>(),
  );

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
      {#each [...constraintsGroupedByType] as [constraintType, constraints] (constraintType)}
        <ConstraintTypeSection {constraintType} {constraints} />
      {/each}
    </div>
  {/if}
</div>

<style lang="scss">
  .constraints-list {
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 1rem;
    }
  }
</style>
