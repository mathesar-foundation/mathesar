<script lang="ts">
  import { createEventDispatcher, tick } from 'svelte';
  import { fade, fly } from 'svelte/transition';

  import focusTrap from '@mathesar-component-library-dir/common/actions/focusTrap';
  import portal from '@mathesar-component-library-dir/common/actions/portal';
  import { focusElement } from '@mathesar-component-library-dir/common/utils/domUtils';
  import Window from '@mathesar-component-library-dir/window/Window.svelte';

  import type { ModalCloseAction, ModalWidth } from './modalTypes';

  const dispatch = createEventDispatcher();

  export let modalId: number | string | undefined = undefined;
  export let isOpen = false;
  export let title: string | undefined = undefined;
  export let size: ModalWidth = 'regular';
  export let allowClose = true;
  export let hasOverlay = true;
  export let closeOn: ModalCloseAction[] = ['button'];
  export let canScrollBody = true;

  let previouslyFocusedElement: Element | undefined = undefined;

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

  function handleOpen() {
    previouslyFocusedElement = document.activeElement ?? undefined;
    dispatch('open');
  }

  function handleClose() {
    focusElement(previouslyFocusedElement);
    previouslyFocusedElement = undefined;
    dispatch('close');
  }

  async function handleOpenStateChange(_isOpen: boolean) {
    await tick();
    if (_isOpen) {
      handleOpen();
    } else {
      handleClose();
    }
  }

  $: void handleOpenStateChange(isOpen);
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <div class="modal" data-modal-id={modalId} use:portal>
    {#if hasOverlay}
      <div
        class="overlay"
        on:click={handleOverlayClick}
        in:fade|global={{ duration: 150 }}
        out:fade|global={{ duration: 150 }}
      />
    {/if}
    <div
      class="window-positioner"
      class:width-regular={size === 'regular'}
      class:width-medium={size === 'medium'}
      class:width-large={size === 'large'}
      in:fly|global={{ y: 20, duration: 150 }}
      out:fly|global={{ y: 20, duration: 150 }}
      use:focusTrap
    >
      <Window {canScrollBody} hasCloseButton={closeOnButton} on:close={close}>
        <div slot="title"><slot name="title" />{title ?? ''}</div>
        <slot />
        <slot name="footer" slot="footer" />
      </Window>
    </div>
  </div>
{/if}
