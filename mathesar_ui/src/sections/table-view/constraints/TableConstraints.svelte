<script lang="ts">
  import { Icon, Modal } from '@mathesar-components';
  import { getContext } from 'svelte';
  import type { TabularDataStore } from '@mathesar/stores/table-data/types';
  import type { Constraint, ConstraintsDataStore } from '@mathesar/stores/table-data/constraints';
  import { States } from '@mathesar/utils/api';
  import { faSpinner } from '@fortawesome/free-solid-svg-icons';
  import TableConstraint from './TableConstraint.svelte';

  export let isOpen = false;

  const tabularData = getContext<TabularDataStore>('tabularData');

  $: constraintsDataStore = $tabularData.constraintsDataStore as ConstraintsDataStore;
  $: state = $constraintsDataStore.state as States;
  $: errorMsg = $constraintsDataStore.error as string;
  $: constraints = $constraintsDataStore.constraints as Constraint[];
  $: countText = constraints.length === 0 ? '' : ` (${constraints.length as number})`;

  async function drop(constraint: Constraint) {
    await (constraintsDataStore as ConstraintsDataStore).drop(constraint.id);
    await (constraintsDataStore as ConstraintsDataStore).fetch({ showLoading: false });
  }
</script>

<Modal bind:isOpen>
  <div class="table-constraints">
    <div class="header">
      Table Constraints{countText}
    </div>
  
    {#if state === States.Idle || state === States.Loading}
      <Icon data={faSpinner} spin={true}/>
    {:else if state === States.Done}
      <div class="constraints-list">
        {#each constraints as constraint (constraint.id)}
          <TableConstraint
            {constraint}
            drop={() => drop(constraint)}
          />
        {/each}
      </div>
    {:else if state === States.Error}
      <div>Unable to fetch table constraints</div>
      <div>{errorMsg}</div>
    {/if}

  </div>
</Modal>

<style global lang="scss">
  @import "TableConstraints.scss";
</style>
