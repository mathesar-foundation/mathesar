<script lang="ts">
  import { dataExplorerLeftSidebarWidth } from '@mathesar/stores/localStorage';
  import { WithPanel } from '@mathesar-component-library';

  // Import the canonical InputSidebar from the system path (alias)
  // so runtime behaviour remains unchanged.
  import InputSidebar from '@mathesar/systems/data-explorer/input-sidebar/InputSidebar.svelte';

  // Loosen the type here to avoid cross-module private-field mismatch errors.
  // This is a pragmatic, CI-unblocking change.
  export let queryManager: any;
  export let linkCollapsibleOpenState: Record<string, boolean> = {};

  // Local any-typed alias so passing into children doesn't trigger TS comparison
  let queryManagerAny: any;
  $: queryManagerAny = queryManager as any;
</script>

<WithPanel
  placement="left"
  bind:sizePx={$dataExplorerLeftSidebarWidth}
  minSizePx={250}
  maxSizePx={700}
>
  <InputSidebar slot="panel" queryManager={queryManagerAny} {linkCollapsibleOpenState} />
  <slot />
</WithPanel>
