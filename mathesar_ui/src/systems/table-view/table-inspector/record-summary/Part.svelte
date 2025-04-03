<script lang="ts">
  import {
    sortableItem,
    sortableTrigger,
  } from '@mathesar/components/sortable/sortable';
  import { iconDeleteMajor, iconGrip } from '@mathesar/icons';
  import { Button, Icon } from '@mathesar-component-library';

  export let label: string | undefined = undefined;
  export let onDelete: () => void;
</script>

<div use:sortableItem class="part">
  <div use:sortableTrigger class="grip"><Icon {...iconGrip} /></div>
  <div class="label">{label ?? ''}</div>
  <div class="editor"><slot /></div>
  <div class="delete">
    <Button size="small" appearance="ghost" on:click={onDelete}>
      <Icon {...iconDeleteMajor} />
    </Button>
  </div>
</div>

<style>
  .part {
    display: grid;
    /* You might think we'd want `center` here, but we use flex-start because we
    want the grip, label, and delete elements to be centered with the first line
    of select elements when there are multiple (wrapped) lines. */
    align-items: flex-start;
    grid-template-columns: auto auto 1fr auto;
  }
  .grip {
    margin: 0.65rem 0.5rem 0 0;
  }
  .label:not(:empty) {
    margin: 0.65rem 0.5rem 0 0;
  }
  .delete {
    margin: 0.3rem -0.5rem 0 0;
  }
  .delete:not(:hover) {
    color: var(--gray-400);
  }
</style>
