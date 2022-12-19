<script lang="ts">
  import { onMount } from 'svelte';
  import { getSheetContext } from './utils';

  const { stores, api } = getSheetContext();
  const { horizontalScrollOffset } = stores;

  export let inheritFontStyle = false;
  let headerRef: HTMLElement;

  function onHScrollOffsetChange(_hscrollOffset: number) {
    if (headerRef) {
      headerRef.scrollLeft = _hscrollOffset;
    }
  }

  $: onHScrollOffsetChange($horizontalScrollOffset);

  function onHeaderScroll(scrollLeft: number) {
    if ($horizontalScrollOffset !== scrollLeft) {
      api.setHorizontalScrollOffset(scrollLeft);
    }
  }

  onMount(() => {
    onHScrollOffsetChange($horizontalScrollOffset);

    const scrollListener = (event: Event) => {
      const { scrollLeft } = event.target as HTMLElement;
      onHeaderScroll(scrollLeft);
    };

    headerRef.addEventListener('scroll', scrollListener);

    return () => {
      headerRef.removeEventListener('scroll', scrollListener);
    };
  });
</script>

<div
  bind:this={headerRef}
  data-sheet-element="header"
  class:inherit-font-style={inheritFontStyle}
>
  <slot />
</div>

<style lang="scss">
  [data-sheet-element='header'] {
    height: var(--sheet-header-height, 32px);
    min-width: 100%;
    position: relative;
    flex-grow: 0;
    flex-shrink: 0;
    border-bottom: 1px solid var(--slate-200);
    user-select: none;
    overflow: hidden;

    :global([data-sheet-element='cell']) {
      border-bottom: none;
      background: var(--slate-100);
      font-size: var(--text-size-small);
      font-weight: 500;
      overflow: hidden;
    }

    &.inherit-font-style {
      :global([data-sheet-element='cell']) {
        font-size: inherit;
        font-weight: inherit;
      }
    }
  }
</style>
