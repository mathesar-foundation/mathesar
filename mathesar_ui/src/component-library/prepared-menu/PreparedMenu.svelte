<script lang="ts">
  import type { ComponentProps } from 'svelte';

  import { Menu } from '@mathesar-component-library-dir/menu';

  import PreparedMenuEntryUi from './PreparedMenuEntryUi.svelte';
  import type { PreparedMenuEntry } from './preparedMenuUtils';

  interface $$Props extends ComponentProps<Menu> {
    entries: PreparedMenuEntry[];
  }

  export let entries: PreparedMenuEntry[];
</script>

<Menu {...$$restProps}>
  {#each entries as entry}
    <PreparedMenuEntryUi {entry} />
  {/each}
</Menu>
