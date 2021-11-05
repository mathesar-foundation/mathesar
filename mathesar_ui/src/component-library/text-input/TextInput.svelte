<script lang="ts">
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
  export let element: HTMLElement = null;

  let focus = false;

  function focusInput(e: Event) {
    if (e.target !== element) {
      element?.focus();
    }
  }
</script>

<div class={['text-input', classes].join(' ')} class:focus class:disabled {style} on:click={focusInput}>
  {#if $$slots.prepend}
    <span class="prepend">
      <slot name="prepend"></slot>
    </span>
  {/if}
  <input bind:this={element} {...$$restProps} type='text' bind:value
          {disabled}
          on:focus={() => { focus = true; }}
          on:blur={() => { focus = false; }}/>
  {#if $$slots.append}
    <span class="append">
      <slot name="append"></slot>
    </span>
  {/if}
</div>

<style global lang="scss">
  @import "TextInput.scss";
</style>
