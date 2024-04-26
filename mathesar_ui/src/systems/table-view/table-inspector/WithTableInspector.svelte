<script lang="ts">
  import type { ComponentProps } from 'svelte';

  import { WithPanel } from '@mathesar-component-library';
  import { tableInspectorWidth } from '@mathesar/stores/localStorage';
  import TableInspector from './TableInspector.svelte';

  export let context: 'page' | 'widget' | 'shared-consumer-page';
  export let showTableInspector: boolean;
  export let activeTabId:
    | ComponentProps<TableInspector>['activeTabId']
    | undefined = undefined;
</script>

{#if context === 'widget'}
  <!--
    Don't use `WithPanel` to display the table widget because `WithPanel` uses
    `height:100%;` but the table widget needs to define its own height.
  -->
  <slot />
{:else}
  <WithPanel
    showPanel={showTableInspector}
    bind:sizePx={$tableInspectorWidth}
    minSizePx={200}
    maxSizePx={600}
  >
    <slot />
    <TableInspector slot="panel" bind:activeTabId />
  </WithPanel>
{/if}
