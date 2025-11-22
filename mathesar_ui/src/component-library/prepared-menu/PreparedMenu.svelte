<script lang="ts">
  import type { ComponentProps } from 'svelte';

  import { Menu } from '@mathesar-component-library-dir/menu';

  import type { ModalMenuOptions } from '../menu/MenuController';

  import PreparedMenuEntryUi from './PreparedMenuEntryUi.svelte';
  import { type MenuEntry, flattenMenuSections } from './preparedMenuUtils';

  interface $$Props extends ComponentProps<Menu> {
    entries: MenuEntry[];
  }

  export let entries: MenuEntry[];
  /**
   * When provided, the menu traps focus and provides keyboard navigation.
   */
  export let modal: ModalMenuOptions | undefined = undefined;
  export let isSubMenu = false;

  $: flattenedEntries = [...flattenMenuSections(entries)];
</script>

<Menu {modal} {isSubMenu} {...$$restProps}>
  {#each flattenedEntries as entry}
    <PreparedMenuEntryUi
      {entry}
      closeRoot={() => {
        modal?.closeRoot();
      }}
    />
  {/each}
</Menu>
