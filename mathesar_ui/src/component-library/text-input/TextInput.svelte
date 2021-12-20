<script context="module" lang="ts">
  let maxId = 0;

  function getId() {
    maxId += 1;
    return maxId;
  }
</script>

<script lang="ts">
  import { createEventDispatcher } from 'svelte';

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
  export let element: HTMLElement = null;

  // Id for the input
  export let id = `text-input-${getId()}`;

  function handleKeypress(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      dispatch('enter');
    }
  }
</script>

<input bind:this={element} {...$$restProps} type='text'
  class={['input-element', 'text-input', classes].join(' ')}
  bind:value
  {id} {disabled}
  on:keypress={handleKeypress}/>

<style global lang="scss">
  @import "TextInput.scss";
</style>
