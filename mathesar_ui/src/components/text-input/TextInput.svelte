<script lang="ts">
  let classes = '';
  export { classes as class };

  export let value = '';
  export let element: HTMLElement = null;

  let focus = false;

  function focusInput(e: Event) {
    if (e.target !== element) {
      element?.focus();
    }
  }
</script>

<div class={['text-input', classes].join(' ')} class:focus on:click={focusInput}>
  {#if $$slots.prepend}
    <span class="prepend">
      <slot name="prepend"></slot>
    </span>
  {/if}
  <input bind:this={element} {...$$restProps} type='text' bind:value
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
