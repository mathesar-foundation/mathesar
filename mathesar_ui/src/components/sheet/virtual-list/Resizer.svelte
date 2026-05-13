<script lang="ts">
  import { onMount } from 'svelte';

  let classes = 'default';
  export { classes as class };
  $: outerClass = ['virtual-list', 'resizer', classes].join(' ');

  let wrapperRef: HTMLElement;
  let height = 0;

  function readContentBoxHeight(el: HTMLElement): number {
    const rect = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const pt = parseInt(cs.paddingTop, 10) || 0;
    const pb = parseInt(cs.paddingBottom, 10) || 0;
    const bt = parseInt(cs.borderTopWidth, 10) || 0;
    const bb = parseInt(cs.borderBottomWidth, 10) || 0;
    const scrollbarH = Math.max(0, el.offsetHeight - el.clientHeight - bt - bb);
    return Math.ceil(rect.height - pt - pb - bt - bb - scrollbarH);
  }

  onMount(() => {
    if (!wrapperRef?.parentNode) {
      return () => {};
    }

    const parentNode = wrapperRef.parentNode as HTMLElement;

    function update() {
      const newHeight = readContentBoxHeight(parentNode);
      if (height !== newHeight) height = newHeight;
      console.log(height);
    }

    update();

    const observer = new ResizeObserver(update);
    observer.observe(parentNode);

    return () => observer.disconnect();
  });
</script>

<div class={outerClass} bind:this={wrapperRef}>
  {#if height > 0}
    <slot {height} />
  {/if}
</div>
