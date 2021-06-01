<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let entry = {};
  export let idKey = 'id';
  export let labelKey = 'label';
  export let childKey = 'children';
  export let linkKey = 'href';
  export let getLink: (arg0: unknown, arg1: number) => string;

  export let level = 0;
  export let expansionInfo = {};

  let link: string;
  $: link = getLink ? getLink(entry, level) : entry[linkKey] as string || null;

  function toggle() {
    expansionInfo = {
      ...expansionInfo,
      [entry[idKey]]: !expansionInfo[entry[idKey]],
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
    <span on:click={toggle}>{entry[labelKey]}</span>

    {#if expansionInfo[entry[idKey]]}
      <ul role="group">
        {#each entry[childKey] as child (child[idKey] || child)}
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
      <a role="treeitem" tabindex="-1" href={link} on:click={nodeSelected} data-tinro-ignore>
        <slot {entry} {level}/>
      </a>
    {:else}
      <span role="treeitem" tabindex="-1" on:click={nodeSelected}>
        <slot {entry} {level}/>
      </span>
    {/if}
  </li>
{/if}
