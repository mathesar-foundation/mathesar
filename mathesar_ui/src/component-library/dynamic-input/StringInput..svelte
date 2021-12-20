<script lang='ts'>
  import TextInput from '@mathesar-component-library-dir/text-input/TextInput.svelte';
  import TextArea from '@mathesar-component-library-dir/text-area/TextArea.svelte';
  import type { DynamicInputElementType } from './types.d';

  export let value = undefined;
  export let inputType: DynamicInputElementType = undefined;
</script>

{#if inputType === 'textarea'}
  <TextArea {...$$restProps} bind:value/>
{:else}
  <TextInput {...$$restProps} bind:value/>
{/if}
