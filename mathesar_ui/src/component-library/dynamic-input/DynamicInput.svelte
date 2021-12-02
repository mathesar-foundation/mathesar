<script lang='ts'>
  import TextInput from '@mathesar-component-library-dir/text-input/TextInput.svelte';
  import Checkbox from '@mathesar-component-library-dir/checkbox/Checkbox.svelte';
  import type { DynamicInputType } from './types.d';

  export let type: DynamicInputType;
  export let value;
  export let id: string = undefined;
</script>

<div class="dynamic-input">
  {#if type === 'boolean'}
    <Checkbox {...$$restProps} {id} bind:value/>
  {:else if type === 'string' || type === 'integer'}
    <TextInput {...$$restProps} {id} bind:value/>
  {/if}
</div>
