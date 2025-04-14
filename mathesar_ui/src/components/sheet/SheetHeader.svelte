<script lang="ts">
  import { onMount } from 'svelte';

  import { getSheetContext } from './utils';

  const { stores, api } = getSheetContext();
  const { horizontalScrollOffset } = stores;
  const { rowWidth } = stores;

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
  data-sheet-element="header-row"
  class:inherit-font-style={inheritFontStyle}
>
  <div style:width="{$rowWidth}px">
    <slot />
  </div>
</div>

<style lang="scss">
  [data-sheet-element='header-row'] {
    min-width: 100%;
    position: relative;
    flex-grow: 0;
    flex-shrink: 0;
    background-color: var(--card-background);
    border-bottom: 1px solid var(--gray-400);
    user-select: none;
    -webkit-user-select: none; /* Safari */
    overflow: hidden;

    > div {
      position: relative;
      height: var(--sheet-header-height, 32px);
      color: var(--text-color-primary);
    }

    &.inherit-font-style {
      :global([data-sheet-element='column-header-cell']) {
        font-size: inherit;
        font-weight: inherit;
      }
    }
  }

  :global(body.theme-dark) [data-sheet-element='header-row'] {
    border-bottom: 1px solid var(--gray-500);
  }
</style>
