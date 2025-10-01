<script lang="ts">
  import type { ComponentProps } from 'svelte';

  import { Menu } from '@mathesar-component-library-dir/menu';

  import PreparedMenuEntryUi from './PreparedMenuEntryUi.svelte';
  import { type MenuEntry, flattenMenuSections } from './preparedMenuUtils';

  interface $$Props extends ComponentProps<Menu> {
    entries: MenuEntry[];
  }

  export let entries: MenuEntry[];

  $: flattenedEntries = [...flattenMenuSections(entries)];
</script>

<Menu {...$$restProps}>
  {#each flattenedEntries as entry}
    <PreparedMenuEntryUi {entry} />
  {/each}
</Menu>
