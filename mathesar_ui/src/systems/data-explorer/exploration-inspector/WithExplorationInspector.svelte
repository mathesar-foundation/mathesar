<script lang="ts">
  import { WithPanel } from '@mathesar-component-library';
  import type { SheetCellDetails } from '@mathesar/components/sheet/selection';
  import { dataExplorerRightSidebarWidth } from '@mathesar/stores/localStorage';
  import type QueryManager from '@mathesar/systems/data-explorer/QueryManager';
  import type QueryRunner from '@mathesar/systems/data-explorer/QueryRunner';
  import type MessageBus from '@mathesar/utils/MessageBus';
  import ExplorationInspector from './ExplorationInspector.svelte';

  export let isInspectorOpen: boolean;
  export let queryHandler: QueryRunner | QueryManager;
  export let canEditMetadata: boolean;
  export let cellSelectionStarted: MessageBus<SheetCellDetails> | undefined =
    undefined;
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
    {cellSelectionStarted}
    on:delete
  />
</WithPanel>
