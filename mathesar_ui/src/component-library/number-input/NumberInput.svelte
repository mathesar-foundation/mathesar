<script lang="ts">
  import BaseInput from '@mathesar-component-library-dir/common/base-components/BaseInput.svelte';
  import type { HTMLNumberInputElement } from './types.d';

  /**
   * DISCUSS: Input type number is highly limited when we need to express
   * high or fixed precision numbers and for formatting which would be
   * required to represent monetary values.
   *
   * We could use a text input with custom aria fields and validation to
   * make it function like a number input.
   */

  /**
   * Value of the input. Use bind tag for two-way binding.
   * Refer Svelte docs for more info on binding form input values.
   */
  export let value: number = undefined;

  // Additional classes
  let classes = '';
  export { classes as class };

  // Disable input
  export let disabled = false;

  // Underlying DOM element for direct access
  export let element: HTMLElement = null;

  // Id for the input
  export let id: string = undefined;

  // Forces input to only allow integer values
  export let isInteger = false;

  // Minimum value for input
  export let min: number = undefined;

  // Maximum value for input
  export let max: number = undefined;

  const validKeyRegex = /^([0-9]|\.|-|\+|e)$/;

  function onInput(e: Event) {
    // Basic validation to prevent entering invalid characters
    const key = (e as InputEvent).data;
    const inputElement = e.target as HTMLNumberInputElement;
    if (key !== null) {
      if (!validKeyRegex.test(key)) {
        inputElement.value = value;
      } else if (
        !inputElement.value &&
        value &&
        (key === 'e' || key === '+' || key === '-')
      ) {
        inputElement.value = value;
      }
    }
    if (
      isInteger &&
      inputElement.value !== null &&
      !Number.isInteger(inputElement.value)
    ) {
      inputElement.value = Math.floor(inputElement.value);
    }
    if (value !== inputElement.value) {
      value = inputElement.value;
    }
  }
</script>

<BaseInput {...$$restProps} bind:id {disabled} />

<input
  bind:this={element}
  {...$$restProps}
  type="number"
  class={['input-element', 'number-input', classes].join(' ')}
  {value}
  {id}
  {disabled}
  {min}
  {max}
  on:input={onInput}
/>
