<script lang="ts">
  import { assertExhaustive } from '@mathesar-component-library-dir/common/utils';
  import {
    ButtonMenuItem,
    LinkMenuItem,
    MenuDivider,
    MenuHeading,
    SubMenu,
  } from '@mathesar-component-library-dir/menu';

  import PreparedMenu from './PreparedMenu.svelte';
  import type { FlattenedMenuEntry } from './preparedMenuUtils';

  export let entry: FlattenedMenuEntry;
  export let closeRoot: () => void = () => {};
</script>

{#if entry.type === 'button'}
  <ButtonMenuItem {...entry} on:click={entry.onClick} />
{:else if entry.type === 'hyperlink'}
  <LinkMenuItem {...entry} />
{:else if entry.type === 'divider'}
  <MenuDivider />
{:else if entry.type === 'heading'}
  <MenuHeading {...entry} />
{:else if entry.type === 'submenu'}
  <SubMenu {...entry} {closeRoot} let:close>
    <PreparedMenu
      modal={{ close, closeRoot, restoreFocusOnClose: false }}
      entries={entry.entries}
      isSubMenu
    />
  </SubMenu>
{:else}
  {assertExhaustive(entry)}
{/if}
