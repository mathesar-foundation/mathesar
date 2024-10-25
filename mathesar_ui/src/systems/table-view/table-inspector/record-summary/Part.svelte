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
    align-items: center;
    grid-template-columns: auto auto 1fr auto;
  }
  .grip {
    margin-right: 0.5rem;
  }
  .label:not(:empty) {
    margin-right: 0.5rem;
  }
  .delete {
    margin-right: -0.5rem;
  }
  .delete:not(:hover) {
    color: var(--slate-400);
  }
</style>
