<script lang="ts">
  import { _ } from 'svelte-i18n';

  import InspectorSection from '@mathesar/components/InspectorSection.svelte';
  import InspectorTabContent from '@mathesar/components/InspectorTabContent.svelte';
  import { dataFormInspectorWidth } from '@mathesar/stores/localStorage';
  import { WithPanel } from '@mathesar-component-library';

  import ActionsPane from './ActionsPane.svelte';
  import { type DataFormManager } from './DataFormManager';

  export let dataFormManager: DataFormManager;
</script>

<div class="data-form-canvas">
  <ActionsPane {dataFormManager} />
  <div class="content-pane">
    <WithPanel
      bind:sizePx={$dataFormInspectorWidth}
      minSizePx={200}
      maxSizePx={600}
    >
      <div></div>
      <div class="data-form-inspector" slot="panel">
        <InspectorTabContent>
          <InspectorSection title={$_('actions')}></InspectorSection>
        </InspectorTabContent>
      </div>
    </WithPanel>
  </div>
</div>

<style lang="scss">
  .data-form-canvas {
    display: grid;
    grid-template-rows: auto 1fr;
    height: 100%;

    .content-pane {
      display: grid;
      grid-template-rows: 1fr auto;
      overflow: hidden;
      padding: var(--sm3);
      padding-top: none;
    }

    .data-form-inspector {
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-l);
      background: var(--elevated-background);
      height: 100%;
    }
  }
</style>
