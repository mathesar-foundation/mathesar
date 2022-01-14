<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import BaseInput from '@mathesar-component-library-dir/common/base-components/BaseInput.svelte';

  const dispatch = createEventDispatcher();

  /**
   * Value of the input. Use bind tag for two-way binding.
   * Refer Svelte docs for more info on binding form input values.
   */
  export let value = '';

  // Additional classes
  let classes = '';
  export { classes as class };

  // Disable input
  export let disabled = false;

  // Underlying DOM element for direct access
  export let element: HTMLElement | undefined = undefined;

  // Id for the input
  export let id: string = undefined;

  function handleKeypress(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      dispatch('enter');
    }
  }
</script>

<BaseInput {...$$restProps} bind:id {disabled}/>

<input bind:this={element} {...$$restProps} type='text'
  class={['input-element', 'text-input', classes].join(' ')}
  bind:value
  {id} {disabled}
  on:keypress={handleKeypress}/>
