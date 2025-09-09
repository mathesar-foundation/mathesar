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
  import DataForm from './DataForm.svelte';
  import DataFormInspector from './inspector/DataFormInspector.svelte';

  export let dataFormManager: DataFormManager;

  $: editableDataFormManager =
    dataFormManager instanceof EditableDataFormManager
      ? dataFormManager
      : undefined;
  $: showInspector = !!editableDataFormManager && $dataFormInspectorVisible;

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
    showPanel={showInspector}
  >
    <div class="workarea">
      <div class="form-holder" on:click={handleFormSelection}>
        <DataForm {dataFormManager} showBranding={false} />
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
    border: 1px solid var(--color-surface-raised-1-border);
    border-radius: var(--border-radius-l);
    background: var(--color-surface-raised-1);
    --df__max-width: calc(60rem + var(--lg1));
    --df__margin: var(--lg2) auto;
    --df__element-spacing: 1rem;

    .form-holder {
      overflow: auto;
    }
  }

  .data-form-inspector-panel {
    border: 1px solid var(--color-surface-raised-2-border);
    border-radius: var(--border-radius-l);
    background: var(--color-surface-supporting);
    height: 100%;
    overflow: hidden;
  }
</style>
