<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { dataFormInspectorWidth } from '@mathesar/stores/localStorage';
  import { WithPanel } from '@mathesar-component-library';

  import {
    type DataFormManager,
    EditableDataFormManager,
  } from './data-form-utilities/DataFormManager';
  import DataFormBuildArea from './DataFormBuildArea.svelte';
  import DataFormInspector from './DataFormInspector.svelte';

  export let dataFormManager: DataFormManager;
</script>

<div class="data-form-canvas">
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

<style lang="scss">
  .data-form-canvas {
    overflow: hidden;
    padding: var(--sm1);
    height: 100%;
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
</style>
