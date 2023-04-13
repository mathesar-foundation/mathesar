<script lang="ts">
  import { WithPanel } from '@mathesar-component-library';
  import InputSidebar from './InputSidebar.svelte';
  import type QueryManager from '../QueryManager';
  import type { ColumnWithLink } from '../utils';

  export let queryManager: QueryManager;
  export let linkCollapsibleOpenState: Record<ColumnWithLink['id'], boolean> =
    {};
</script>

<WithPanel placement="left" sizePx={400} minSizePx={300} maxSizePx={700}>
  <InputSidebar slot="panel" {queryManager} {linkCollapsibleOpenState} />
  <slot />
</WithPanel>
