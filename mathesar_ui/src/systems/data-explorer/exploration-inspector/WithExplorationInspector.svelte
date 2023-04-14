<script lang="ts">
  import { WithPanel } from '@mathesar-component-library';
  import { dataExplorerRightSidebarWidth } from '@mathesar/stores/localStorage';
  import type QueryManager from '@mathesar/systems/data-explorer/QueryManager';
  import type QueryRunner from '@mathesar/systems/data-explorer/QueryRunner';
  import ExplorationInspector from './ExplorationInspector.svelte';

  export let isInspectorOpen: boolean;
  export let queryHandler: QueryRunner | QueryManager;
  export let canEditMetadata: boolean;
</script>

<WithPanel
  showPanel={isInspectorOpen}
  bind:sizePx={$dataExplorerRightSidebarWidth}
  minSizePx={250}
  maxSizePx={600}
>
  <slot />
  <ExplorationInspector
    slot="panel"
    {queryHandler}
    {canEditMetadata}
    on:delete
  />
</WithPanel>
