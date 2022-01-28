<script lang="ts">
  import { fly } from 'svelte/transition';
  import type { FlyParams } from 'svelte/transition';
  import { Icon, Seesaw, Button, Spinner } from '@mathesar-component-library';
  import type {
    Constraint,
    TabularDataStore,
  } from '@mathesar/stores/table-data/types';
  import {
    faTrash,
    faCheck,
    faArrowLeft,
    faExclamationTriangle,
  } from '@fortawesome/free-solid-svg-icons';
  import { toast } from '@mathesar/stores/toast';
  import { getContext } from 'svelte';

  export let constraint: Constraint;
  export let drop: () => Promise<void>;

  const tabularData = getContext<TabularDataStore>('tabularData');

  let isConfirmingDrop = false;
  let isSubmittingDrop = false;
  let useTransitionOut = false;

  async function handleDrop() {
    isSubmittingDrop = true;
    useTransitionOut = true;
    try {
      await drop();
    } catch (error) {
      toast.fromError(error);
      useTransitionOut = false;
    } finally {
      isSubmittingDrop = false;
    }
  }

  $: columns = $tabularData.columnsDataStore.getColumnsByIds(
    constraint.columns,
  );
  $: columnNames = columns.map((columnInConstraint) => columnInConstraint.name);
  $: columnSummary = columnNames.join(', ');
  $: transitionDuration = useTransitionOut ? 200 : (0 as number);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  $: transition = { x: 200, duration: transitionDuration } as FlyParams;
</script>

<div class="table-constraint" class:is-submitting-drop={isSubmittingDrop}>
  <Seesaw position={isConfirmingDrop ? 'left' : 'right'}>
    <div class="view" slot="right">
      <div>
        <div><span class="name">{constraint.name}</span></div>
        <div>
          <span class="type">{constraint.type}</span>
          <span>&bull;</span>
          <span class="columns">{columnSummary}</span>
        </div>
      </div>
      <div>
        <Button
          on:click={() => {
            isConfirmingDrop = true;
          }}
          class="drop"
          title={`Drop constraint '${constraint.name}'`}
        >
          <Icon data={faTrash} />
        </Button>
      </div>
    </div>

    <div class="confirm-drop" slot="left" out:fly={transition}>
      <div class="warning-icon">
        <Icon data={faExclamationTriangle} size="3em" />
      </div>
      <div>
        <div>Drop constaint '<span class="name">{constraint.name}</span>'?</div>
        <div class="buttons">
          <Button
            size="small"
            on:click={() => {
              isConfirmingDrop = false;
            }}
            class="cancel"
            title="Cancel"
          >
            <Icon data={faArrowLeft} />
            <span>Cancel</span>
          </Button>
          <Button
            size="small"
            on:click={handleDrop}
            title="Confirm drop constraint"
            disabled={isSubmittingDrop}
          >
            {#if isSubmittingDrop}
              <Spinner />
            {:else}
              <Icon data={faCheck} />
            {/if}
            <span>Drop</span>
          </Button>
        </div>
      </div>
    </div>
  </Seesaw>
</div>

<style global lang="scss">
  @import 'TableConstraint.scss';
</style>
