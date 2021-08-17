<script lang="ts">
  import { portal } from '@mathesar-components';

  // Additional classes
  let classes = '';
  export { classes as class };

  // Inline styles
  export let style = '';

  // Boolean to open/close modal
  export let isOpen = true;

  // Close when esc key is pressed
  export let closeOnEsc = true;

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && isOpen && closeOnEsc) {
      isOpen = false;
    }
  }
</script>

<svelte:window on:keydown={handleKeydown}/>

{#if isOpen}
  <div class="modal-wrapper" use:portal>
    <div class={['modal', classes].join(' ')} {style}>
      <slot/>
    </div>
  </div>
{/if}

<style global lang="scss">
  @import "Modal.scss";
</style>
