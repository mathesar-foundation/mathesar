<script lang="ts">
  import {
    dataFormInspectorVisible,
    dataFormInspectorWidth,
  } from '@mathesar/stores/localStorage';
  import { WithPanel } from '@mathesar-component-library';

  import {
    type DataFormManager,
    EditableDataFormManager,
  } from './data-form-utilities/DataFormManager';
  import DataFormBuildArea from './DataFormBuildArea.svelte';
  import DataFormInspector from './inspector/DataFormInspector.svelte';

  export let dataFormManager: DataFormManager;

  $: editableDataFormManager =
    dataFormManager instanceof EditableDataFormManager
      ? dataFormManager
      : undefined;

  function handleFormSelection(e: MouseEvent) {
    if (editableDataFormManager) {
      const { target } = e;
      if (target instanceof HTMLElement) {
        if (!target.closest('[data-form-selectable]')) {
          editableDataFormManager.resetSelectedElement();
        }
      }
    }
  }
</script>

<div class="data-form-canvas">
  <WithPanel
    bind:sizePx={$dataFormInspectorWidth}
    minSizePx={200}
    maxSizePx={600}
    showPanel={editableDataFormManager && $dataFormInspectorVisible}
  >
    <div class="workarea">
      <div class="form-holder" on:click={handleFormSelection}>
        <DataFormBuildArea {dataFormManager} />
      </div>
    </div>
    <div class="data-form-inspector-panel" slot="panel">
      {#if editableDataFormManager}
        <DataFormInspector dataFormManager={editableDataFormManager} />
      {/if}
    </div>
  </WithPanel>
</div>

<style lang="scss">
  .data-form-canvas {
    overflow: hidden;
    padding: 0 var(--sm3) var(--sm3) var(--sm3);
    height: 100%;
  }

  .workarea {
    width: 100%;
    height: 100%;
    overflow: hidden;
    display: grid;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-l);
    background: var(--elevated-background);
    --data_forms__z-index__field-header: 1;
    --data_forms__z-index__field-add-dropdown-trigger: 2;
    --data_forms__label-input-gap: 0.5rem;
    --data_forms__selectable-element-padding: 1rem;

    .form-holder {
      overflow: auto;
    }
  }

  .data-form-inspector-panel {
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-l);
    background: var(--elevated-background);
    height: 100%;
    overflow: hidden;
  }
</style>
