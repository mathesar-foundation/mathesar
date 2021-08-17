<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Size } from '@mathesar-components/types';
  import { portal } from '@mathesar-components';

  const dispatch = createEventDispatcher();

  // Additional classes
  let classes = '';
  export { classes as class };

  // Inline styles
  export let style = '';

  // Size
  export let size: Size = 'medium';

  // Boolean to open/close modal
  export let isOpen = true;

  // Close when esc key is pressed
  export let closeOnEsc = true;

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && isOpen && closeOnEsc) {
      isOpen = false;
    }
  }

  function dispatchEventOnClose(_isOpen: boolean) {
    if (!_isOpen) {
      dispatch('close');
    }
  }

  $: dispatchEventOnClose(isOpen);
</script>

<svelte:window on:keydown={handleKeydown}/>

{#if isOpen}
  <div class="modal-wrapper" use:portal>
    <div class={['modal', `modal-size-${size}`, classes].join(' ')} {style}>
      <div class="body">
        <slot/>
      </div>

      {#if $$slots.footer}
        <div class="footer">
          <slot name="footer"/>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style global lang="scss">
  @import "Modal.scss";
</style>
