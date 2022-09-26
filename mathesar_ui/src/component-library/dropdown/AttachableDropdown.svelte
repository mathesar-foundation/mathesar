<script lang="ts">
  import {
    createEventDispatcher,
    getContext,
    onDestroy,
    setContext,
    tick,
  } from 'svelte';
  import { derived } from 'svelte/store';
  import type { Placement } from '@popperjs/core/lib/enums';
  import portal from '@mathesar-component-library-dir/common/actions/portal';
  import popper from '@mathesar-component-library-dir/common/actions/popper';
  import clickOffBounds from '@mathesar-component-library-dir/common/actions/clickOffBounds';
  import { AccompanyingElements } from './AccompanyingElements';

  const dispatch = createEventDispatcher();

  export let trigger: HTMLElement | undefined = undefined;
  export let placement: Placement = 'bottom-start';
  export let isOpen = false;
  export let classes = '';
  export { classes as class };
  export let closeOnInnerClick = false;

  let contentElement: HTMLElement | undefined;

  const parentAccompanyingElements = getContext<
    AccompanyingElements | undefined
  >('dropdownAccompanyingElements');
  async function setThisContentToAccompanyParent() {
    if (!contentElement) {
      await tick();
    }
    if (!contentElement) {
      return;
    }
    parentAccompanyingElements?.add(contentElement);
  }
  async function unsetThisContentToAccompanyParent() {
    if (!contentElement) {
      await tick();
    }
    if (!contentElement) {
      return;
    }
    parentAccompanyingElements?.delete(contentElement);
  }
  onDestroy(unsetThisContentToAccompanyParent);

  const accompanyingElements = new AccompanyingElements(
    parentAccompanyingElements,
  );
  setContext('dropdownAccompanyingElements', accompanyingElements);

  const clickOffBoundsReferences = derived(
    accompanyingElements,
    (_accompanyingElements) => [trigger, ..._accompanyingElements],
  );

  function watchIsOpen(_isOpen: boolean) {
    if (_isOpen) {
      dispatch('open');
      void setThisContentToAccompanyParent();
    } else {
      dispatch('close');
      void unsetThisContentToAccompanyParent();
    }
  }
  $: watchIsOpen(isOpen);

  function close() {
    isOpen = false;
  }

  function checkAndCloseOnInnerClick() {
    if (closeOnInnerClick) {
      close();
    }
  }
</script>

{#if isOpen}
  <div
    class={['dropdown content', classes].join(' ')}
    bind:this={contentElement}
    use:portal
    use:popper={{
      reference: trigger,
      options: { placement },
    }}
    use:clickOffBounds={{
      callback: close,
      references: clickOffBoundsReferences,
    }}
    on:click={checkAndCloseOnInnerClick}
  >
    <slot {close} />
  </div>
{/if}
