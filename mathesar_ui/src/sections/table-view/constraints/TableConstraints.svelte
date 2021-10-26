<script lang="ts">
  import { Icon, Modal } from '@mathesar-components';
  import { getContext } from 'svelte';
  import type { TabularDataStore } from '@mathesar/stores/table-data/types';
  import type { Constraint, ConstraintsDataStore } from '@mathesar/stores/table-data/constraints';
  import { States } from '@mathesar/utils/api';
  import { faSpinner } from '@fortawesome/free-solid-svg-icons';
  // TODO uncomment when adding the "Drop" button
  // import type { Constraint } from "@mathesar/stores/table-data/constraints";
  // import Icon from "@mathesar/components/icon/Icon.svelte";
  // import { faTrash } from '@fortawesome/free-solid-svg-icons';
  // import Button from "@mathesar/components/button/Button.svelte";

  export let isOpen = false;

  const tabularData = getContext<TabularDataStore>('tabularData');
  $: constraintsDataStore = $tabularData.constraintsDataStore as ConstraintsDataStore;
  $: state = $constraintsDataStore.state as States;
  $: errorMsg = $constraintsDataStore.error as string;
  $: constraints = $constraintsDataStore.constraints as Constraint[];
  $: countText = constraints.length === 0 ? '' : ` (${constraints.length as number})`;

  function columnSummary(constraint: Constraint) {
    return constraint.columns.join(', ');
  }

  // function drop(constraint: Constraint) {
  //   console.log(`DROP ${constraint.id}`); //TODO
  // }
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
          <div class="table-constraint">
            <div>
              <div class="name">{constraint.name}</div>
              <div>
                <span class="type">{constraint.type}</span>
                <span>&bull;</span>
                <span class="columns">{columnSummary(constraint)}</span>
              </div>
            </div>
            <div>
              <!-- TODO Add this in a future PR -->
              <!-- <Button
                size=small
                on:click={() => drop(constraint)} class="drop"
                title={`Drop constraint "${constraint.name}"`}
              >
                <Icon data={faTrash} />
              </Button> -->
            </div>
          </div>
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
