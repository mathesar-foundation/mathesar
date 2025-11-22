<script lang="ts">
  import type { Placement } from '@popperjs/core/lib/enums';
  import {
    createEventDispatcher,
    getContext,
    onDestroy,
    setContext,
    tick,
  } from 'svelte';
  import { derived } from 'svelte/store';

  import clickOffBounds from '@mathesar-component-library-dir/common/actions/clickOffBounds';
  import popper from '@mathesar-component-library-dir/common/actions/popper';
  import portal from '@mathesar-component-library-dir/common/actions/portal';
  import StringOrComponent from '@mathesar-component-library-dir/string-or-component/StringOrComponent.svelte';
  import type { ComponentAndProps } from '@mathesar-component-library-dir/types';

  import { AccompanyingElements } from './AccompanyingElements';

  const dispatch = createEventDispatcher();

  export let trigger: HTMLElement | undefined = undefined;
  /**
   * These `Placement` values will be tried in sequence until a placement is
   * found that does not cause the dropdown content to overflow the viewport.
   */
  export let placements: Placement[] = [
    'bottom-start',
    'bottom-end',
    'top-start',
    'top-end',
    'right-start',
    'left-start',
  ];
  export let preferredPlacement: Placement | undefined = undefined;
  export let isOpen = false;
  export let classes = '';
  export { classes as class };
  export let closeOnInnerClick = false;
  export let content: string | string[] | ComponentAndProps | undefined =
    undefined;
  export let portalTarget: HTMLElement | undefined = undefined;
  /**
   * When true, the content element will automatically reposition when it
   * resizes.
   */
  export let autoReposition = false;

  /**
   * By default, we ensure that the dropdown content width is no smaller than
   * the width of its trigger element — unless the trigger element is wider than
   * 250px, in which case it ensures that the dropdown content width is no
   * smaller than 250px.
   *
   * This option controls that threshold. Set it to 0 if you want to disable
   * this min-width behavior, allowing the content to be quite narrow.
   */
  export let matchTriggerWidthPxUpTo: number | undefined = undefined;

  let contentElement: HTMLElement | undefined;

  $: placement = preferredPlacement ?? placements[0] ?? 'bottom-start';
  $: fallbackPlacements = (() => {
    const p = placements.filter((pm) => pm !== placement);
    if (p.length === 0) {
      // If we didn't get any fallback placements, we want to send `undefined`
      // to popper so that popper uses its default fallback placements.
      return undefined;
    }
    return p;
  })();

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
    use:portal={portalTarget}
    use:popper={{
      reference: trigger,
      autoReposition,
      options: {
        placement,
        modifiers: [
          {
            name: 'flip',
            options: {
              fallbackPlacements,
            },
          },
        ],
      },
      customModifierOptions: {
        matchTriggerWidthPxUpTo,
      },
    }}
    use:clickOffBounds={{
      callback: close,
      references: clickOffBoundsReferences,
    }}
    on:click={checkAndCloseOnInnerClick}
    on:click
    on:mouseenter
    on:mouseleave
    data-attachable-dropdown
  >
    {#if $$slots.default}
      <slot {close} />
    {:else if content}
      <StringOrComponent arg={content} />
    {/if}
  </div>
{/if}
