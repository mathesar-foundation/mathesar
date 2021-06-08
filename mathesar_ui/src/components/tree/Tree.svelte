<script lang="ts">
  import TreeItemComponent from './TreeItem.svelte';
  import type { TreeItem } from './Tree.d';

  export let data: TreeItem[] = [];
  export let idKey = 'id';
  export let labelKey = 'label';
  export let childKey = 'children';
  export let linkKey = 'href';
  export let getLink: (arg0: unknown, arg1: number) => string;

  let expansionInfo = {};
</script>

<ul role="tree" class="tree">
  {#each data as entry (entry[idKey] || entry)}
    <TreeItemComponent {idKey} {labelKey} {childKey} {linkKey} {entry} {getLink} level={0} on:nodeSelected
              let:level let:entry={innerEntry} bind:expansionInfo>
      <slot entry={innerEntry} {level}>
        {innerEntry[labelKey]}
      </slot>
    </TreeItemComponent>
  {/each}
</ul>

<style global lang="scss">
  @import "Tree.scss";
</style>
