<script lang="ts">
  import { onMount, tick } from 'svelte';

  import type { SheetVirtualRowsApi } from '@mathesar/components/sheet/types';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';

  const tabularData = getTabularDataStoreFromContext();

  $: ({ recordsData } = $tabularData);
  $: ({ savedRecordRowsWithGroupHeaders } = recordsData);

  export let api: SheetVirtualRowsApi;

  async function recalculateAllHeights() {
    await tick();
    api.recalculateHeightsAfterIndex(0);
  }

  onMount(() =>
    savedRecordRowsWithGroupHeaders.subscribe(() => {
      void recalculateAllHeights();
    }),
  );
</script>
