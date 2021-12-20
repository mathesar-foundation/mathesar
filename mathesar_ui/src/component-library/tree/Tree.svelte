<script lang="ts">
  import TextInput from '@mathesar-component-library-dir/text-input/TextInput.svelte';
  import Icon from '@mathesar-component-library-dir/icon/Icon.svelte';
  import { InputGroup, InputGroupText } from '@mathesar-component-library-dir/input-group';
  import { filterTree } from '@mathesar-component-library-dir/common/utils/filterUtils';
  import { faSearch } from '@fortawesome/free-solid-svg-icons';
  import TreeItemComponent from './TreeItem.svelte';
  import type { TreeItem } from './Tree.d';

  export let data: TreeItem[] = [];
  export let idKey = 'id';
  export let labelKey = 'label';
  export let childKey = 'children';
  export let linkKey = 'href';
  export let getLink: (arg0: unknown, arg1: number) => string;

  export let search = false;
  export let expandedItems = new Set();
  export let selectedItems = new Set();
  let searchText = '';

  $: displayData = filterTree(data, labelKey, childKey, searchText);
</script>

<div class="tree">
  {#if search}
    <InputGroup class="search-box">
      <InputGroupText>
        <Icon class="search-icon" data={faSearch}/>
      </InputGroupText>
      <TextInput placeholder="search" bind:value={searchText}/>
    </InputGroup>

    {#if searchText && displayData.length === 0}
      <div class="empty">
        <slot name="empty">
          No data found
        </slot>
      </div>
    {/if}
  {/if}

  <ul role="tree">
    {#each displayData as entry (entry[idKey] || entry)}
      <TreeItemComponent {idKey} {labelKey} {childKey} {linkKey} {entry}
                {searchText} {getLink} level={0} on:nodeSelected
                let:level let:entry={innerEntry} bind:expandedItems
                bind:selectedItems>
        <slot entry={innerEntry} {level}>
          {innerEntry[labelKey]}
        </slot>
      </TreeItemComponent>
    {/each}
  </ul>
</div>

<style global lang="scss">
  @import "Tree.scss";
</style>
