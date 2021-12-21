<script context="module" lang="ts">
  let maxId = 0;

  function getId() {
    maxId += 1;
    return maxId;
  }
</script>

<script lang='ts'>
  import DynamicInput from '@mathesar-component-library-dir/dynamic-input/DynamicInput.svelte';
  import type { DynamicInputType } from '@mathesar-component-library-dir/dynamic-input/types.d';
  import type { LayoutInputElement } from './types.d';

  export let type: DynamicInputType;
  export let label: LayoutInputElement['label'];
  export let store;

  const inputId = `form-input-${getId()}`;
</script>

<div class="form-input">
  <!-- TODO: Use common Label component here -->
  {#if type !== 'boolean'}
    <label for={inputId}>{label}</label>
  {/if}
  <DynamicInput {...$$restProps} id={inputId} {type} {label} bind:value={$store}/>
</div>
