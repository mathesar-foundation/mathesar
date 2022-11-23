<script lang="ts">
  import { Icon, iconWarning } from '@mathesar-component-library';
  import { preloadCommonData } from '@mathesar/utils/preloadData';

  const commonData = preloadCommonData();
</script>

{#if commonData?.live_demo_mode}
  <div>
    <Icon {...iconWarning} />
    <strong>Demo Mode</strong>
    <span>
      Mathesar is in live demo mode. Each session has its own copy of demo data.
      Data will be deleted regularly.
    </span>
  </div>
{/if}

<style lang="scss">
  div {
    flex: 0 0;
    padding: var(--size-xx-small);
    color: var(--yellow-200);
    /**
     * TODO: Have a separate variable for this color
     * Needs to come from Figma designs
     */
    background: #2d2508;
    display: flex;
    align-items: center;

    > :global(* + *) {
      margin-left: var(--size-xx-small);
    }
  }
</style>
