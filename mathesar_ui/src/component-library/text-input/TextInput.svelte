<script lang="ts">
  import BaseInput from '@mathesar-component-library-dir/common/base-components/BaseInput.svelte';

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
  export let element: HTMLInputElement | undefined = undefined;

  // Id for the input
  export let id: string | undefined = undefined;

  export let hasValidationErrors = false;
</script>

<BaseInput {...$$restProps} bind:id {disabled} />

<input
  bind:this={element}
  {...$$restProps}
  type="text"
  class={['input-element', 'text-input', classes].join(' ')}
  class:has-validation-errors={hasValidationErrors}
  bind:value
  {id}
  {disabled}
  on:input
  on:focus
  on:blur
  on:keydown
/>
