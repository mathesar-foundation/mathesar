<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Spinner from '@mathesar-component-library-dir/spinner/Spinner.svelte';

  const dispatch = createEventDispatcher();

  /**
   * Value of the input. Use bind tag for two-way binding.
   * Refer Svelte docs for more info on binding form input values.
   */
  export let value = '';

  // Additional classes
  let classes = '';
  export { classes as class };

  // Inline styles
  export let style = '';

  // Disable input
  export let disabled = false;

  // Underlying DOM element for direct access
  export let element: HTMLInputElement | undefined = undefined;

  export let isLoading = false;
  export let hasValidationErrors = false;

  /**
   * This is a side-effect. The source-of-truth is the focus state of the DOM
   * element itself.
   */
  let hasFocus = false;

  $: isDisabledForAnyReason = disabled || isLoading;
  
  export function focus(): void {
    if (!element) {
      return;
    }
    element.focus();
  }

  export function selectAll(): void {
    if (!element) {
      return;
    }
    element.setSelectionRange(0, element.value.length);
  }

  export function focusAndSelectAll(): void {
    focus();
    selectAll();
  }
  
  export function blur(): void {
    if (!element) {
      return;
    }
    element.blur();
  }

  function handleFocus() {
    dispatch('focus');
    hasFocus = true;
  }

  function handleBlur() {
    dispatch('blur');
    hasFocus = false;
  }
  
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      dispatch('enter');
    }
    if (e.key === 'Escape') {
      dispatch('esc');
    }
  }
</script>

<div
  class={['text-input', classes].join(' ')}
  class:focus={hasFocus}
  class:disabled={isDisabledForAnyReason}
  class:has-validation-errors={hasValidationErrors}
  {style}
  on:click={focus}
  on:keydown={handleKeydown}
>
  {#if $$slots.prepend}
    <span class="prepend">
      <slot name="prepend"></slot>
    </span>
  {/if}
  <input
    bind:value
    bind:this={element}
    type='text'
    disabled={isDisabledForAnyReason}
    on:focus={handleFocus}
    on:blur={handleBlur}
    {...$$restProps}
  />
  {#if $$slots.append}
    <span class="append">
      <slot name="append"></slot>
    </span>
  {/if}
  {#if isLoading}
    <div class="spinner"><Spinner /></div>
  {/if}
</div>

<style global lang="scss">
  @import "TextInput.scss";
</style>
