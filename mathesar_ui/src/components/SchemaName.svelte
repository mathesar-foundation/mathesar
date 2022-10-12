<script lang="ts">
  import type { SchemaEntry } from '@mathesar/AppTypes';
  import { iconSchema } from '@mathesar/icons';
  import NameWithIcon from './NameWithIcon.svelte';

  export let schema: SchemaEntry;
  export let isLocked = false;
</script>

<div class="container" class:is-locked={isLocked}>
  <NameWithIcon icon={iconSchema}>{schema.name}</NameWithIcon>
</div>

<style lang="scss">
  // TODO: Is there a better way to do style
  // the icon and name inside NameWithIcon component?
  :global(.container .icon) {
    width: 1.71rem;
    height: 1.71rem;
    border-radius: var(--border-radius-m);
    background-color: var(--brand-500);
    color: var(--white);
    padding: 0.3rem;
    opacity: 1;
  }

  :global(.container.is-locked .icon) {
    background-color: var(--slate-800);
  }

  :global(.container .name) {
    font-size: 1.428rem;
    font-weight: normal;
    color: var(--slate-800);
    margin-left: 0.25rem;
  }
</style>
