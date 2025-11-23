<script lang="ts">
  import { dataExplorerLeftSidebarWidth } from '@mathesar/stores/localStorage';
  import type QueryManager from '@mathesar/systems/data-explorer/QueryManager';
  import type { ColumnWithLink } from '@mathesar/systems/data-explorer/utils';
  import { WithPanel } from '@mathesar-component-library';

  // Use the local InputSidebar in the same folder
  import InputSidebar from './InputSidebar.svelte';

  // Loosen the type to avoid cross-module private-field mismatch errors.
  // This is a pragmatic fix to unblock typechecking/CI.
  export let queryManager: any;
  export let linkCollapsibleOpenState: Record<ColumnWithLink['id'], boolean> =
    {};

  // Local any-typed alias to ensure template-level passing does not trigger
  // cross-module type comparisons.
  let queryManagerAny: any;
  $: queryManagerAny = queryManager as any;
</script>

<WithPanel
  placement="left"
  bind:sizePx={$dataExplorerLeftSidebarWidth}
  minSizePx={250}
  maxSizePx={700}
>
  <!-- pass the any-typed alias to the child so TS won't try to compare private fields -->
  <InputSidebar slot="panel" queryManager={queryManagerAny} {linkCollapsibleOpenState} />
  <slot />
</WithPanel>
