<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { ConstraintType } from '@mathesar/api/rest/types/tables/constraints';
  import { States } from '@mathesar/api/rest/utils/requestUtils';
  import {
    type Constraint,
    getTabularDataStoreFromContext,
  } from '@mathesar/stores/table-data';
  import { Icon, iconLoading } from '@mathesar-component-library';

  import ConstraintTypeSection from './ConstraintTypeSection.svelte';

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
      }
      groupedConstraints.set(constraint.type, [constraint]);
      return groupedConstraints;
    },
    new Map<ConstraintType, Constraint[]>(),
  );

  $: isEmpty = constraints.length === 0;
  $: isLoading = state === States.Idle || state === States.Loading;
  // Only show the spinner during the _initial_ loading event. Hide it for
  // subsequent updates so that we can rely on the spinner used on the button
  // for the more specific update.
  $: shouldShowLoadingSpinner = isEmpty && isLoading;
</script>

<div class="table-constraints">
  {#if shouldShowLoadingSpinner}
    <Icon {...iconLoading} />
  {:else if state === States.Error}
    <div>{$_('unable_to_fetch_table_constraints')}</div>
    <div>{errorMsg}</div>
  {:else if isEmpty}
    <div>{$_('no_constraints')}</div>
  {:else}
    <div class="constraints-list">
      <ConstraintTypeSection
        constraintType="primary"
        constraints={constraintsGroupedByType.get('primary') || []}
      />
      <ConstraintTypeSection
        constraintType="foreignkey"
        constraints={constraintsGroupedByType.get('foreignkey') || []}
      />
      <ConstraintTypeSection
        constraintType="unique"
        constraints={constraintsGroupedByType.get('unique') || []}
      />
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
