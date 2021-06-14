<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { faCaretRight } from '@fortawesome/free-solid-svg-icons';
  import { Icon } from '@mathesar-components';
  import { IconRotate } from '@mathesar-components/types';
  import type { TreeItem } from './Tree.d';

  const dispatch = createEventDispatcher();

  export let entry: TreeItem = {};
  export let idKey = 'id';
  export let labelKey = 'label';
  export let childKey = 'children';
  export let linkKey = 'href';
  export let getLink: (arg0: unknown, arg1: number) => string;

  export let level = 0;
  export let expansionInfo = {};

  let link: string;
  $: link = getLink ? getLink(entry, level) : entry[linkKey] as string || null;

  $: id = entry[idKey] as string;
  $: children = entry[childKey] as TreeItem[];

  function toggle() {
    expansionInfo = {
      ...expansionInfo,
      [id]: !expansionInfo[id],
    };
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
    <div class="item parent" on:click={toggle}>
      <Icon data={faCaretRight} rotate={expansionInfo[id] ? IconRotate.NINETY : null}/>
      <span>{entry[labelKey]}</span>
    </div>

    {#if expansionInfo[id]}
      <ul role="group">
        {#each children as child (child[idKey] || child)}
          <svelte:self {idKey} {labelKey} {childKey} {linkKey} entry={child} {getLink} level={level + 1} on:nodeSelected
                        let:level={innerLevel} let:entry={innerEntry} bind:expansionInfo>
            <slot entry={innerEntry} level={innerLevel}/>
          </svelte:self>
        {/each}
      </ul>
    {/if}
  </li>

{:else}
  <li role="none" class="nav-item">
    {#if link}
      <a class="item" role="treeitem" tabindex="-1" href={link} on:click={nodeSelected} data-tinro-ignore>
        <slot {entry} {level}/>
      </a>
    {:else}
      <div class="item" role="treeitem" tabindex="-1" on:click={nodeSelected}>
        <slot {entry} {level}/>
      </div>
    {/if}
  </li>
{/if}
