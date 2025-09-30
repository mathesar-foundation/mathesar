<script lang="ts">
  import { assertExhaustive } from '@mathesar-component-library-dir/common/utils';
  import {
    ButtonMenuItem,
    LinkMenuItem,
    MenuDivider,
    MenuHeading,
  } from '@mathesar-component-library-dir/menu';

  import type { PreparedMenuEntry } from './preparedMenuUtils';

  export let entry: PreparedMenuEntry;
</script>

{#if entry.type === 'button'}
  <ButtonMenuItem {...entry} on:click={entry.onClick} />
{:else if entry.type === 'hyperlink'}
  <LinkMenuItem {...entry} />
{:else if entry.type === 'divider'}
  <MenuDivider />
{:else if entry.type === 'heading'}
  <MenuHeading {...entry} />
{:else}
  {assertExhaustive(entry)}
{/if}
