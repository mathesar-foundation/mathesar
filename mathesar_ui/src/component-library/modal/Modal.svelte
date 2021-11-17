<script lang="ts">
  import type { Size } from '@mathesar-component-library/types';
  import { portal } from '@mathesar-component-library';
  import type { ModalVisibilityStore } from './ModalVisibilityStore';
  import type { ModalCloseAction } from './modal';

  export let isOpen: ModalVisibilityStore;
  export let title: string;
  let classes = '';
  export { classes as class };
  export let style = '';
  export let size: Size = 'medium';
  
  export let closeOn: ModalCloseAction[] = ['button', 'esc', 'overlay'];

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && $isOpen && closeOn.includes('esc')) {
      $isOpen = false;
    }
  }
</script>

<svelte:window on:keydown={handleKeydown}/>

{#if $isOpen}
  <div class="modal-wrapper" use:portal>
    <div class={['modal', `modal-size-${size}`, classes].join(' ')} {style}>

      {#if $$slots.title || title}
        <div class="title">
          {#if $$slots.title}<slot name="title"/>{:else}{title}{/if}
        </div>
      {/if}
      
      <div class="body">
        <slot/>
      </div>

      {#if $$slots.footer}
        <div class="footer"><slot name="footer"/></div>
      {/if}
    </div>
  </div>
{/if}

<style global lang="scss">
  @import "Modal.scss";
</style>
