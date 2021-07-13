<script>
  import Resizer from './Resizer.svelte';
  import List from './List.svelte';

  function getItemSize(index, style) {
    return 30;
  }
</script>

<Resizer let:height>
  <List
    {height}
    itemCount={50000}
    itemSize={getItemSize}
    let:items
    >
    {#each items as it (it.key)}
      <div style={it.style}>Row {it.index}</div>
    {/each}
  </List>
</Resizer>

<style global lang="scss">
  @import "VirtualList.scss";
</style>
