<script lang="ts">
  import { preloadCommonData } from '@mathesar/utils/preloadData';

  const commonData = preloadCommonData();
</script>

{#if !commonData?.live_demo_mode}
  <div>
    Mathesar is in live demo mode. Each session has its own copy of demo data.
    Data will be deleted regularly.
  </div>
{/if}
