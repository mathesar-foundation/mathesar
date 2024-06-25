<script lang="ts">
  import { dataExplorerLeftSidebarWidth } from '@mathesar/stores/localStorage';
  import type QueryManager from '@mathesar/systems/data-explorer/QueryManager';
  import type { ColumnWithLink } from '@mathesar/systems/data-explorer/utils';
  import { WithPanel } from '@mathesar-component-library';

  import InputSidebar from './InputSidebar.svelte';

  export let queryManager: QueryManager;
  export let linkCollapsibleOpenState: Record<ColumnWithLink['id'], boolean> =
    {};
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
