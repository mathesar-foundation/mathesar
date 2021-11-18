<script lang="ts">
  import { faTimes } from '@fortawesome/free-solid-svg-icons';
  import type { Size } from '@mathesar-component-library/types';
  import { Button, Icon, portal } from '@mathesar-component-library';
  import type { ModalCloseAction } from './modal';

  export let isOpen = false;
  // eslint-disable-next-line no-undef-init
  export let title: string | undefined = undefined;
  let classes = '';
  export { classes as class };
  export let style = '';
  export let size: Size = 'medium';
  
  export let closeOn: ModalCloseAction[] = ['button', 'esc', 'overlay'];

  $: closeOnButton = closeOn.includes('button');
  $: closeOnEsc = closeOn.includes('esc');
  $: closeOnOverlay = closeOn.includes('overlay');

  function close() {
    isOpen = false;
  }
  
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && isOpen && closeOnEsc) {
      close();
    }
  }

  function handleOverlayClick() {
    if (closeOnOverlay) {
      close();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown}/>

{#if isOpen}
  <div class="modal-wrapper" use:portal >
    <div class="overlay" on:click={handleOverlayClick}/>
    <div class={['modal', `modal-size-${size}`, classes].join(' ')} {style}>
      {#if closeOnButton}
        <Button class="close-button" on:click={close}><Icon data={faTimes}/></Button>
      {/if}

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
