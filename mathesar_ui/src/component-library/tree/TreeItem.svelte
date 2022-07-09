<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { faCaretRight } from '@fortawesome/free-solid-svg-icons';
  import { Icon, Button } from '@mathesar-component-library';
  import type { TreeItem } from './TreeTypes';

  const dispatch = createEventDispatcher();

  export let entry: TreeItem = {};
  export let idKey = 'id';
  export let labelKey = 'label';
  export let childKey = 'children';
  export let linkKey = 'href';
  export let getLink: (arg0: unknown, arg1: number) => string;

  export let searchText = '';
  export let level = 0;
  export let expandedItems = new Set();
  export let selectedItems = new Set();

  let link: string | undefined;
  $: link = getLink
    ? getLink(entry, level)
    : (entry[linkKey] as string) ?? undefined;

  $: id = entry[idKey] as string;
  $: children = entry[childKey] as TreeItem[];

  $: isOpen = searchText?.trim() || expandedItems.has(id);
  $: activeClass = selectedItems.has(entry[idKey]) ? 'active' : '';
  $: padding = 12 + 12 * level;

  function toggle() {
    if (searchText?.trim()) {
      isOpen = !isOpen;
    } else {
      if (expandedItems.has(id)) {
        expandedItems.delete(id);
      } else {
        expandedItems.add(id);
      }
      expandedItems = new Set(expandedItems);
    }
  }

  function nodeSelected(e: Event) {
    dispatch('nodeSelected', {
      node: entry,
      level,
      link,
      originalEvent: e,
    });
  }
</script>

{#if entry[childKey]}
  <li aria-level={level + 1} role="treeitem" tabindex="-1">
    <Button appearance="plain" class="item parent" on:click={toggle}>
      <Icon data={faCaretRight} rotate={isOpen ? 90 : undefined} />
      <span>{entry[labelKey]}</span>
    </Button>

    {#if isOpen}
      <ul role="group">
        {#each children as child (child[idKey] || child)}
          <svelte:self
            {idKey}
            {labelKey}
            {childKey}
            {linkKey}
            entry={child}
            {getLink}
            level={level + 1}
            on:nodeSelected
            let:level={innerLevel}
            let:entry={innerEntry}
            bind:expandedItems
            bind:selectedItems
          >
            <slot entry={innerEntry} level={innerLevel} />
          </svelte:self>
        {/each}
      </ul>
    {/if}
  </li>
{:else}
  <li role="none" class="nav-item">
    {#if link}
      <a
        class="item {activeClass}"
        role="treeitem"
        href={link}
        style="padding-left:{padding}px"
        on:click={nodeSelected}
        data-tinro-ignore
      >
        <slot {entry} {level} />
      </a>
    {:else}
      <Button
        appearance="plain"
        class="item {activeClass}"
        role="treeitem"
        style="padding-left:{padding}px"
        on:click={nodeSelected}
      >
        <slot {entry} {level} />
      </Button>
    {/if}
  </li>
{/if}
