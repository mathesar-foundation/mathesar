<script lang="ts">
  import { tableInspectorWidth } from '@mathesar/stores/localStorage';
  import { WithPanel } from '@mathesar-component-library';

  import TableInspector from './TableInspector.svelte';

  export let context: 'page' | 'widget' | 'shared-consumer-page';
  export let showTableInspector: boolean;
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
    <TableInspector slot="panel" />
  </WithPanel>
{/if}
