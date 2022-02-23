<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import TextInput from '@mathesar-component-library-dir/text-input/TextInput.svelte';
  import TextArea from '@mathesar-component-library-dir/text-area/TextArea.svelte';
  import type { DynamicInputInterfaceType } from './types.d';

  const dispatch = createEventDispatcher();

  export let value: string | undefined = undefined;
  export let interfaceType: DynamicInputInterfaceType | undefined = undefined;

  function handleKeydown(e: KeyboardEvent) {
    switch (e.key) {
      case 'Enter':
      case 'Escape':
      case 'Tab':
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowRight':
      case 'ArrowLeft':
        dispatch('specialKeyDown', { key: e.key, value });
        break;
      default:
        break;
    }
  }

  function handleInput() {
    dispatch('update', {
      value,
    });
  }
</script>

{#if interfaceType === 'textarea'}
  <TextArea
    {...$$restProps}
    bind:value
    on:focus={() => dispatch('focusIn', { value })}
    on:blur={() => dispatch('focusOut', { value })}
    on:keydown={handleKeydown}
    on:input={handleInput}
  />
{:else}
  <TextInput
    {...$$restProps}
    bind:value
    on:focus={() => dispatch('focusIn', { value })}
    on:blur={() => dispatch('focusOut', { value })}
    on:keydown={handleKeydown}
    on:input={handleInput}
  />
{/if}
