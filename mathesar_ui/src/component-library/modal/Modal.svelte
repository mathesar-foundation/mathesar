<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { faTimes } from '@fortawesome/free-solid-svg-icons';
  import type { Size } from '@mathesar-component-library/types';
  import { Button, Icon, portal } from '@mathesar-component-library';
  import type { ModalCloseAction } from './modal.d';

  const dispatch = createEventDispatcher();

  export let isOpen = false;
  // eslint-disable-next-line no-undef-init
  export let title: string | undefined = undefined;
  let classes = '';
  export { classes as class };
  export let style = '';
  export let size: Size = 'medium';
  export let allowClose = true;
  export let closeOn: ModalCloseAction[] = ['button'];

  $: closeOnButton = allowClose && closeOn.includes('button');
  $: closeOnEsc = allowClose && closeOn.includes('esc');
  $: closeOnOverlay = allowClose && closeOn.includes('overlay');

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

  $: if (isOpen) { dispatch('open'); } else { dispatch('close'); }
</script>

<svelte:window on:keydown={handleKeydown}/>

{#if isOpen}
  <div class="modal-wrapper" use:portal >
    <div
      class="overlay"
      on:click={handleOverlayClick}
      in:fade="{{ duration: 150 }}"
      out:fade="{{ duration: 150 }}"
    />
    <div
      class={['modal', `modal-size-${size}`, classes].join(' ')}
      {style}
      in:fly="{{ y: 20, duration: 150 }}"
      out:fly="{{ y: 20, duration: 150 }}"
    >
      {#if $$slots.title || title || closeOnButton}
        <div class=title-bar>
          <div class="title">
            {#if $$slots.title}<slot name="title"/>{/if}
            {#if title}{title}{/if}
          </div>
          {#if closeOnButton}
            <Button appearance=plain class=close-button on:click={close}>
              <Icon data={faTimes}/>
            </Button>
          {/if}
        </div>
      {/if}
      
      <div class="body">
        <slot {close}/>
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
