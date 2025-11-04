<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import { dndDragHandle } from '@mathesar/components/drag-and-drop/dnd';
  import { iconDeleteMajor, iconGrip } from '@mathesar/icons';
  import { Button, Icon, InputGroupText } from '@mathesar-component-library';

  type T = $$Generic;

  interface $$Events {
    remove: void;
  }

  const dispatch = createEventDispatcher<$$Events>();
</script>

<Button appearance="action" on:click={() => dispatch('remove')}>
  <Icon {...iconDeleteMajor} />
</Button>
<InputGroupText>
  <div class="handle" use:dndDragHandle>
    <Icon {...iconGrip} />
  </div>
</InputGroupText>

<style lang="scss">
  .handle {
    cursor: grab;
    background: var(--color-bg-raised-2);
    padding-inline: var(--sm5);
    border-radius: var(--border-radius-m);
  }
</style>
