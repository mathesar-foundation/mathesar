<script lang='ts'>
  import { Icon, Seesaw } from '@mathesar-components';
  import type { Constraint } from '@mathesar/stores/table-data/constraints';
  import {
    faTrash,
    faCheck,
    faArrowLeft,
    faExclamationTriangle,
  } from '@fortawesome/free-solid-svg-icons';
  import Button from '@mathesar/components/button/Button.svelte';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();
  
  export let constraint: Constraint;

  let isConfirmingDrop = false;
  
  $: columnSummary = constraint.columns.join(', ');
</script>

<div class='table-constraint' class:isConfirmingDrop>
  <Seesaw position={isConfirmingDrop ? 'left' : 'right'}>

    <div class='view' slot='right' >
      <div>
        <div><span class='name'>{constraint.name}</span></div>
        <div>
          <span class='type'>{constraint.type}</span>
          <span>&bull;</span>
          <span class='columns'>{columnSummary}</span>
        </div>
      </div>
      <div>
        <Button
          on:click={() => { isConfirmingDrop = true; }}
          class='drop'
          title={`Drop constraint '${constraint.name}'`}
        >
          <Icon data={faTrash} />
        </Button>
      </div>
    </div>

    <div class='confirm-drop' slot='left'>
      <div class='warning-icon'><Icon data={faExclamationTriangle} size='3em'/></div>
      <div>
        <div>Drop constaint '<span class='name'>{constraint.name}</span>'?</div>
        <div class='buttons'>
          <Button
            size='small'
            on:click={() => { isConfirmingDrop = false; }}
            class='cancel'
            title='Cancel'
          >
            <Icon data={faArrowLeft}/>
            <span>Cancel</span>
          </Button>
          <Button
            size='small'
            on:click={() => dispatch('drop')}
            title='Confirm drop constraint'
          >
            <Icon data={faCheck}/>
            <span>Drop</span>
          </Button>
        </div>
      </div>
    </div>

  </Seesaw>
</div>

<style global lang='scss'>
  @import 'TableConstraint.scss';
</style>
