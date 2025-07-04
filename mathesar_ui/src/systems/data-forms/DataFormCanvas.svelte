<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { dataFormInspectorWidth } from '@mathesar/stores/localStorage';
  import { WithPanel } from '@mathesar-component-library';

  import ActionsPane from './ActionsPane.svelte';
  import {
    type DataFormManager,
    EditableDataFormManager,
  } from './data-form-utilities/DataFormManager';
  import DataFormBuildArea from './DataFormBuildArea.svelte';
  import DataFormInspector from './DataFormInspector.svelte';

  export let dataFormManager: DataFormManager;
</script>

<div class="data-form-canvas">
  <ActionsPane {dataFormManager} />
  <div class="content-pane">
    <WithPanel
      bind:sizePx={$dataFormInspectorWidth}
      minSizePx={200}
      maxSizePx={600}
      showPanel={dataFormManager instanceof EditableDataFormManager}
    >
      <div class="workarea">
        <DataFormBuildArea {dataFormManager} />
      </div>
      <div class="data-form-inspector-panel" slot="panel">
        {#if dataFormManager instanceof EditableDataFormManager}
          <DataFormInspector {dataFormManager} />
        {/if}
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
    }

    .workarea {
      width: 100%;
      height: 100%;
      overflow: hidden;
      display: grid;
    }

    .data-form-inspector-panel {
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-l);
      background: var(--elevated-background);
      height: 100%;
      overflow: hidden;
    }
  }
</style>
