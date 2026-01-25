<script lang="ts">
  import { dataExplorerLeftSidebarWidth } from '@mathesar/stores/localStorage';
  import type QueryManager from '@mathesar/systems/data-explorer/QueryManager';
  import { WithPanel } from '@mathesar-component-library';

  import InputSidebar from './InputSidebar.svelte';

  export let queryManager: QueryManager;
  export let linkCollapsibleOpenState: Record<string, boolean> = {};
</script>

<WithPanel
  placement="left"
  bind:sizePx={$dataExplorerLeftSidebarWidth}
  minSizePx={250}
  maxSizePx={700}
>
  <InputSidebar slot="panel" {queryManager} {linkCollapsibleOpenState} />
  <slot />
</WithPanel>
