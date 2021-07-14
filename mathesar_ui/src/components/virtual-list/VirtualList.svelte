<script>
  import Resizer from './Resizer.svelte';
  import List from './List.svelte';

  export let itemCount = 100;
  export let paddingBottom = 100;

  export let scrollOffset = 0;
  export let horizontalScrollOffset = 0;

  function getItemSize() {
    return 30;
  }
</script>

<Resizer let:height>
  <List
    {height}
    {itemCount}
    {paddingBottom}
    itemSize={getItemSize}
    bind:scrollOffset
    bind:horizontalScrollOffset
    let:items
    >
    {#each items as it (it?.key || it)}
      {#if it}
        <slot style={it.style} index={it.index}></slot>
      {/if}
    {/each}
  </List>
</Resizer>

<style global lang="scss">
  @import "VirtualList.scss";
</style>
