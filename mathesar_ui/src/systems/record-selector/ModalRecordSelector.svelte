<script lang="ts">
  import { createEventDispatcher, tick } from 'svelte';
  import { fade } from 'svelte/transition';

  import { type ModalController, portal } from '@mathesar-component-library';

  import type { RecordSelectorController } from './RecordSelectorController';
  import RecordSelectorWindow from './RecordSelectorWindow.svelte';

  const dispatch = createEventDispatcher();

  export let recordSelectorController: RecordSelectorController;
  export let modalController: ModalController;

  let windowPositionerElement: HTMLElement | undefined;

  $: ({ columnWithNestedSelectorOpen } = recordSelectorController);
  $: nestedSelectorIsOpen = !!$columnWithNestedSelectorOpen;
  $: ({ isOpen, isOnTop } = modalController);
  $: closeOnOverlay = $isOnTop && !nestedSelectorIsOpen;

  function close() {
    $isOpen = false;
    recordSelectorController.cancel();
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

  $: void dispatchOpenOrClose($isOpen);
</script>

{#if $isOpen}
  <div use:portal class="modal-record-selector">
    {#if $isOnTop}
      <div
        class="overlay"
        on:click={handleOverlayClick}
        in:fade={{ duration: 150 }}
        out:fade={{ duration: 150 }}
      />
    {/if}
    <div class="window-positioner" bind:this={windowPositionerElement}>
      <div class="root-record-selector">
        <RecordSelectorWindow
          {windowPositionerElement}
          controller={recordSelectorController}
        />
      </div>
      <!--
        `.nested-record-selector` elements will appear here from the portal
        used in `RecordSelectorTable.svelte`. We can't easily render them
        directly here because of the recursive logic used to create them.
        Using a portal is easier than dealing with the CSS if the record
        selectors were nested at a DOM level.
      -->
    </div>
  </div>
{/if}

<style lang="scss">
  .modal-record-selector {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: var(--modal-z-index, auto);
    isolation: isolate;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    /**
     * The space between the top of the bottom-most nested selector and the top
     * of the viewport when the viewport is short enough to cause the upper
     * record selector windows to overflow off the top of the viewport.
     */
    --nested-selector-extra-top-inset: 2rem;
  }
  .overlay {
    background-color: var(--modal-overlay);
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 1;
  }
  .window-positioner {
    width: 100%;
    flex: 1 0 max-content;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    overflow: hidden;

    .root-record-selector,
    :global(.nested-record-selector) {
      position: relative;
      max-height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .root-record-selector {
      max-height: calc(100vh - var(--nested-selector-extra-top-inset));
    }
    :global(.nested-record-selector) {
      margin-top: calc(-1 * var(--nested-selector-extra-top-inset));
      padding-top: var(--nested-selector-extra-top-inset);
      max-height: calc(100vh - var(--nested-selector-extra-top-inset));
    }
  }
</style>
