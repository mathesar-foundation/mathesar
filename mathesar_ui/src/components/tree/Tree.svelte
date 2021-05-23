<script lang="ts">
  import TreeItem from './TreeItem.svelte';

  export let data = [];
  export let idKey = 'id';
  export let labelKey = 'label';
  export let childKey = 'children';
  export let linkKey = 'href';
  export let getLink: (arg0: unknown, arg1: number) => string;

  let expansionInfo = {};
</script>

<ul role="tree" class="tree">
  {#each data as entry (entry[idKey] || entry)}
    <TreeItem {idKey} {labelKey} {childKey} {linkKey} {entry} {getLink} level={0} on:nodeSelected
              let:level let:entry={innerEntry} bind:expansionInfo>
      <slot entry={innerEntry} {level}>
        {innerEntry[labelKey]}
      </slot>
    </TreeItem>
  {/each}
</ul>

<style global lang="scss">
  @import "Tree.scss";
</style>
