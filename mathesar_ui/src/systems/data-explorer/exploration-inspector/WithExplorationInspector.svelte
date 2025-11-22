<script lang="ts">
  import { dataExplorerRightSidebarWidth } from '@mathesar/stores/localStorage';
  import type QueryManager from '@mathesar/systems/data-explorer/QueryManager';
  import type { QueryRunner } from '@mathesar/systems/data-explorer/QueryRunner';
  import { WithPanel } from '@mathesar-component-library';

  import ExplorationInspector from './ExplorationInspector.svelte';

  export let isInspectorOpen: boolean;
  export let queryHandler: QueryRunner | QueryManager;
</script>

<WithPanel
  showPanel={isInspectorOpen}
  bind:sizePx={$dataExplorerRightSidebarWidth}
  minSizePx={250}
  maxSizePx={600}
>
  <slot />
  <ExplorationInspector slot="panel" {queryHandler} on:delete />
</WithPanel>
