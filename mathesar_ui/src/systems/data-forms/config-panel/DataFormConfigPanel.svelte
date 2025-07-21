<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { EditableDataFormManager } from '../data-form-utilities/DataFormManager';

  import FieldConfig from './field-config/FieldConfig.svelte';
  import FieldNavigation from './FieldNavigation.svelte';
  import FormConfig from './form-config/FormConfig.svelte';

  export let dataFormManager: EditableDataFormManager;

  $: ({ selectedElement } = dataFormManager);
</script>

<div class="data-form-config">
  <div class="nav">
    <FieldNavigation
      field={$selectedElement && 'field' in $selectedElement
        ? $selectedElement.field
        : undefined}
      {dataFormManager}
    />
  </div>
  <div class="content">
    {#if $selectedElement?.type === 'field'}
      <FieldConfig />
    {:else}
      <FormConfig {dataFormManager} />
    {/if}
  </div>
</div>

<style lang="scss">
  .data-form-config {
    overflow: hidden;
    height: 100%;
    display: flex;
    flex-direction: column;

    .content {
      overflow-x: hidden;
      overflow-y: auto;
    }
  }
</style>
