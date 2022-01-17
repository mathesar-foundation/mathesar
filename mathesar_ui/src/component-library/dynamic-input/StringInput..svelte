<script lang='ts'>
  import TextInput from '@mathesar-component-library-dir/text-input/TextInput.svelte';
  import TextArea from '@mathesar-component-library-dir/text-area/TextArea.svelte';
  import type { DynamicInputInterfaceType } from './types.d';

  export let value = undefined;
  export let interfaceType: DynamicInputInterfaceType = undefined;
</script>

{#if interfaceType === 'textarea'}
  <TextArea {...$$restProps} bind:value/>
{:else}
  <TextInput {...$$restProps} bind:value/>
{/if}
