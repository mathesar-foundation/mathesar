<script lang="ts">
  import BaseInput from '@mathesar-component-library-dir/common/base-components/BaseInput.svelte';
  import type { TextAreaProps } from '@mathesar-component-library-dir/text-area/TextAreaTypes';

  type $$Props = TextAreaProps;

  // Id for the input
  export let id: string | undefined = undefined;

  // Disable input
  export let disabled = false;

  let classes = '';
  export { classes as class };

  /**
   * Value of the input. Use bind tag for two-way binding.
   * Refer Svelte docs for more info on binding form input values.
   */
  export let value: string | undefined | null = '';

  export let element: $$Props['element'] = undefined;
</script>

<BaseInput {...$$restProps} bind:id {disabled} />

<textarea
  bind:this={element}
  {...$$restProps}
  class="input-element text-area {classes}"
  {id}
  {disabled}
  bind:value
  on:input
  on:focus
  on:blur
  on:keydown
/>
