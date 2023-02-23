<script lang="ts">
  import { Help, Icon } from '@mathesar-component-library';
  import { iconJoinEmailList, iconGoToMarketingSite } from '@mathesar/icons';
  import { preloadCommonData } from '@mathesar/utils/preloadData';

  const commonData = preloadCommonData();

  $: liveDemo = !!commonData?.live_demo_mode;
</script>

{#if liveDemo}
  <div class="demo-banner">
    <div class="side left">
      <i>Mathesar is in live demo mode.</i>
      <Help>
        Each session has its own copy of demo data. Data will be deleted
        regularly.
      </Help>
    </div>
    <div class="side right">
      <a href="https://mathesar.org/mailing-list.html" target="_blank">
        <Icon {...iconJoinEmailList} />
        Join Email List
      </a>
      <a href="http://mathesar.org" target="_blank">
        <Icon {...iconGoToMarketingSite} />
        Mathesar.org
      </a>
    </div>
  </div>
{/if}

<style>
  .demo-banner {
    padding: 0 0.5rem;
    color: var(--yellow-200);
    /**
     * TODO: Have a separate variable for this color
     * Needs to come from Figma designs
     */
    background: #2d2508;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
  }
  .side {
    margin: 0.5rem;
  }
  .right {
    flex: 1 0 auto;
    display: flex;
    justify-content: flex-end;
  }
  a {
    color: inherit;
    text-decoration: none;
  }
  a + a {
    margin-left: 1rem;
  }
</style>
