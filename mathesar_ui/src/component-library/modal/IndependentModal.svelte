<script lang="ts">
  import { createEventDispatcher, tick } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { Button, Icon, portal } from '@mathesar-component-library';
  import { iconClose } from '@mathesar-component-library-dir/common/icons';
  import type {
    ModalCloseAction,
    ModalWidth,
    VerticalAlign,
  } from './modalTypes';

  const dispatch = createEventDispatcher();

  export let isOpen = false;
  export let title: string | undefined = undefined;
  let classes = '';
  export { classes as class };
  export let style = '';
  export let size: ModalWidth = 'medium';
  export let allowClose = true;
  export let hasOverlay = true;
  export let closeOn: ModalCloseAction[] = ['button'];
  export let verticalAlign: VerticalAlign | undefined = 'center';

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

  async function dispatchOpenOrClose(_isOpen: boolean) {
    await tick();
    dispatch(_isOpen ? 'open' : 'close');
  }

  $: void dispatchOpenOrClose(isOpen);
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <div
    class="modal-wrapper"
    use:portal
    class:v-align-top={verticalAlign === 'top'}
    class:v-align-center={verticalAlign === 'center'}
    class:v-align-bottom={verticalAlign === 'bottom'}
  >
    {#if hasOverlay}
      <div
        class="overlay"
        on:click={handleOverlayClick}
        in:fade={{ duration: 150 }}
        out:fade={{ duration: 150 }}
      />
    {/if}
    <div
      class={['modal', `modal-size-${size}`, classes].join(' ')}
      {style}
      in:fly={{ y: 20, duration: 150 }}
      out:fly={{ y: 20, duration: 150 }}
    >
      {#if $$slots.title || title || closeOnButton}
        <div class="title-bar">
          <div class="title">
            <slot name="title" />
            {title ?? ''}
          </div>
          {#if closeOnButton}
            <Button appearance="plain" class="close-button" on:click={close}>
              <Icon {...iconClose} />
            </Button>
          {/if}
        </div>
      {/if}

      <div class="body">
        <slot {close} />
      </div>

      <div class="footer"><slot name="footer" /></div>
    </div>
  </div>
{/if}
