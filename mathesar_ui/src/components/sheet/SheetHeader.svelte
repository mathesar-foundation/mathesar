<script lang="ts">
  import { onMount } from 'svelte';

  export let horizontalScrollOffset: number;

  let headerRef: HTMLElement;

  function onHScrollOffsetChange(_hscrollOffset: number) {
    if (headerRef) {
      headerRef.scrollLeft = _hscrollOffset;
    }
  }

  $: onHScrollOffsetChange(horizontalScrollOffset);

  function onHeaderScroll(scrollLeft: number) {
    if (horizontalScrollOffset !== scrollLeft) {
      horizontalScrollOffset = scrollLeft;
    }
  }

  onMount(() => {
    onHScrollOffsetChange(horizontalScrollOffset);

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

<div bind:this={headerRef} data-sheet-element="header">
  <slot />
</div>

<style lang="scss">
  [data-sheet-element='header'] {
    height: var(--sheet-header-height, 32px);
    min-width: 100%;
    position: relative;
    flex-grow: 0;
    flex-shrink: 0;
    border-bottom: 1px solid #e5e5e5;
    user-select: none;
    overflow: hidden;

    :global([data-sheet-element='cell']) {
      border-bottom: none;
      background: #f9f9f9;
    }
  }
</style>
