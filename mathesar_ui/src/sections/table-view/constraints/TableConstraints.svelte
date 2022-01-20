<script lang="ts">
  import type { ModalController } from '@mathesar-component-library';
  import { Icon, ControlledModal, Button } from '@mathesar-component-library';
  import { getContext } from 'svelte';
  import type { TabularDataStore } from '@mathesar/stores/table-data/types';
  import type {
    Constraint,
    ConstraintsDataStore,
  } from '@mathesar/stores/table-data/types';
  import { States } from '@mathesar/utils/api';
  import { faSpinner } from '@fortawesome/free-solid-svg-icons';
  import TableConstraint from './TableConstraint.svelte';

  export let controller: ModalController;

  const tabularData = getContext<TabularDataStore>('tabularData');

  $: constraintsDataStore =
    $tabularData.constraintsDataStore as ConstraintsDataStore;
  $: state = $constraintsDataStore.state as States;
  $: errorMsg = $constraintsDataStore.error as string;
  $: constraints = $constraintsDataStore.constraints as Constraint[];
  $: isEmpty = constraints.length === 0;
  $: isLoading = state === States.Idle || state === States.Loading;
  // Only show the spinner during the _initial_ loading event. Hide it for
  // subsequent updates so that we can rely on the spinner used on the button
  // for the more specific update.
  $: shouldShowLoadingSpinner = isEmpty && (isLoading as boolean);
  $: countText = isEmpty ? '' : ` (${constraints.length as number})`;

  function remove(constraint: Constraint) {
    return (constraintsDataStore as ConstraintsDataStore).remove(constraint.id);
  }
</script>

<ControlledModal {controller} title={`Table Constraints${countText}`}>
  <div class="table-constraints">
    {#if shouldShowLoadingSpinner}
      <Icon data={faSpinner} spin={true} />
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
</ControlledModal>

<style global lang="scss">
  @import 'TableConstraints.scss';
</style>
