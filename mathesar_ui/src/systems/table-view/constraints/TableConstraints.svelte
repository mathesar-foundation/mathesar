<script lang="ts">
  import { Icon, iconLoading } from '@mathesar-component-library';
  import {
    getTabularDataStoreFromContext,
    type Constraint,
    type ConstraintsDataStore,
  } from '@mathesar/stores/table-data';
  import { States } from '@mathesar/api/utils/requestUtils';
  import ConstraintTypeSection from './ConstraintTypeSection.svelte';
  import type { ConstraintType } from '@mathesar/api/types/tables/constraints';

  const tabularData = getTabularDataStoreFromContext();

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
      <ConstraintTypeSection
        constraintType="primary"
        constraints={constraintsGroupedByType.get('unique') || []}
      />
      <ConstraintTypeSection
        constraintType="foreignkey"
        constraints={constraintsGroupedByType.get('foreignkey') || []}
      />
      <ConstraintTypeSection
        constraintType="unique"
        constraints={constraintsGroupedByType.get('unique') || []}
      />
      <!-- TODO: Same for check/exclude too? -->
      <!-- TODO: Create a ticket for null constraints -->
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
