<script lang="ts">
  import { WithPanel } from '@mathesar-component-library';
  import { tableInspectorWidth } from '@mathesar/stores/localStorage';
  import TableInspector from './TableInspector.svelte';

  export let showTableInspector: boolean;
</script>

<WithPanel
  showPanel={showTableInspector}
  bind:sizePx={$tableInspectorWidth}
  minSizePx={200}
  maxSizePx={600}
>
  <slot />
  <TableInspector slot="panel" />
</WithPanel>
