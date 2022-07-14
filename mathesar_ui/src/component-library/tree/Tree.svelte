<script lang="ts">
  import TextInput from '@mathesar-component-library-dir/text-input/TextInput.svelte';
  import Icon from '@mathesar-component-library-dir/icon/Icon.svelte';
  import {
    InputGroup,
    InputGroupText,
  } from '@mathesar-component-library-dir/input-group';
  import { filterTree } from '@mathesar-component-library-dir/common/utils/filterUtils';
  import {
    hasProperty,
    hasStringProperty,
  } from '@mathesar-component-library-dir/common/utils/typeUtils';
  import { faSearch } from '@fortawesome/free-solid-svg-icons';
  import TreeItemComponent from './TreeItem.svelte';

  type TreeItem = $$Generic;
  interface $$Slots {
    default: {
      entry: TreeItem;
      level: number;
    };
  }
  type $$Events = TreeItemComponent<TreeItem>['$$events_def'];

  export let data: TreeItem[] = [];

  export let getId: (entry: TreeItem) => unknown = (item: TreeItem) => {
    if (hasProperty(item, 'id')) {
      return item.id;
    }
    return String(item);
  };
  export let getLabel: (entry: TreeItem) => string = (item: TreeItem) => {
    if (hasStringProperty(item, 'label')) {
      return item.label;
    }
    return String(item);
  };
  export let getAndSetChildren:
    | {
        get: (entry: TreeItem) => TreeItem[] | undefined;
        set: (entry: TreeItem, children?: TreeItem[]) => TreeItem;
      }
    | undefined = undefined;

  export let getLink: (arg0: TreeItem) => string | undefined;

  export let search = false;
  export let expandedItems = new Set();
  export let selectedItems = new Set();
  let searchText = '';

  $: displayData = filterTree(data, getLabel, getAndSetChildren, searchText);
</script>

<div class="tree">
  {#if search}
    <InputGroup class="search-box">
      <InputGroupText>
        <Icon class="search-icon" data={faSearch} />
      </InputGroupText>
      <TextInput placeholder="search" bind:value={searchText} />
    </InputGroup>

    {#if searchText && displayData.length === 0}
      <div class="empty">
        <slot name="empty">No data found</slot>
      </div>
    {/if}
  {/if}

  <ul role="tree">
    {#each displayData as entry (getId(entry) || entry)}
      <TreeItemComponent
        {getId}
        {getLabel}
        {getAndSetChildren}
        {entry}
        {searchText}
        {getLink}
        level={0}
        on:nodeSelected
        let:level
        let:entry={innerEntry}
        bind:expandedItems
        bind:selectedItems
      >
        <slot entry={innerEntry} {level}>
          {getLabel(innerEntry)}
        </slot>
      </TreeItemComponent>
    {/each}
  </ul>
</div>
