<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Icon, Button } from '@mathesar-component-library';
  import { iconVerticallyCollapsed } from '@mathesar-component-library-dir/common/icons';

  type TreeItem = $$Generic;

  const dispatch = createEventDispatcher<{
    nodeSelected: {
      node: TreeItem;
      level: number;
      link?: string;
      originalEvent: Event;
    };
  }>();

  export let entry: TreeItem;
  export let getId: (entry: TreeItem) => unknown;
  export let getLabel: (entry: TreeItem) => string;
  export let getAndSetChildren:
    | {
        get: (entry: TreeItem) => TreeItem[] | undefined;
        set: (entry: TreeItem, children?: TreeItem[]) => TreeItem;
      }
    | undefined;
  export let getLink: (arg0: TreeItem) => string | undefined;

  export let searchText = '';
  export let level = 0;
  export let expandedItems = new Set();
  export let selectedItems = new Set();

  $: link = getLink ? getLink(entry) : undefined;
  $: id = getId(entry);
  $: childrenOfEntry = getAndSetChildren?.get(entry) ?? undefined;

  $: isOpen = searchText?.trim() || expandedItems.has(id);
  $: isActive = selectedItems.has(getId(entry));
  $: padding = 12 + 12 * level;
  $: ariaSelected = isActive ? true : undefined;

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

{#if childrenOfEntry}
  <li
    aria-level={level + 1}
    role="treeitem"
    tabindex="-1"
    aria-selected={ariaSelected}
  >
    <Button appearance="plain" class="item parent" on:click={toggle}>
      <Icon {...iconVerticallyCollapsed} rotate={isOpen ? 90 : undefined} />
      <span>{getLabel(entry)}</span>
    </Button>

    {#if isOpen}
      <ul role="group">
        {#each childrenOfEntry as child (getId(child) || child)}
          <svelte:self
            {getId}
            {getLabel}
            {getAndSetChildren}
            {getLink}
            entry={child}
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
        class="item"
        class:active={isActive}
        aria-selected={ariaSelected}
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
        class="item {isActive ? 'active' : ''}"
        role="treeitem"
        aria-selected={ariaSelected}
        style="padding-left:{padding}px"
        on:click={nodeSelected}
      >
        <slot {entry} {level} />
      </Button>
    {/if}
  </li>
{/if}
