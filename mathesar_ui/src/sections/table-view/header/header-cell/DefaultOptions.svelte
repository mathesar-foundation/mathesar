<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import {
    faSortAmountDown,
    faSortAmountDownAlt,
    faThList,
  } from '@fortawesome/free-solid-svg-icons';
  import { Icon, Button } from '@mathesar-component-library';
  import type {
    Meta,
    Column,
    SortOption,
    GroupOption,
  } from '@mathesar/stores/table-data/types';

  const dispatch = createEventDispatcher();

  export let meta: Meta;
  export let column: Column;

  $: ({ sort, group } = meta);
  $: sortDirection = ($sort as SortOption)?.get(column.name);
  $: hasGrouping = ($group as GroupOption)?.has(column.name);

  function handleSort(order: 'asc' | 'desc') {
    if (sortDirection === order) {
      meta.removeSort(column.name);
    } else {
      meta.addUpdateSort(column.name, order);
    }
    dispatch('close');
  }

  function toggleGroup() {
    if (hasGrouping) {
      meta.removeGroup(column.name);
    } else {
      meta.addGroup(column.name);
    }
    dispatch('close');
  }
</script>

<ul>
  <li>
    <Button appearance="plain" on:click={() => handleSort('asc')}>
      <Icon class="opt" data={faSortAmountDownAlt}/>
      <span>
        {#if sortDirection === 'asc'}
          Remove asc sort
        {:else}
          Sort Ascending
        {/if}
      </span>
    </Button>
  </li>
  <li>
    <Button appearance="plain" on:click={() => handleSort('desc')}>
      <Icon class="opt" data={faSortAmountDown}/>
      <span>
        {#if sortDirection === 'desc'}
          Remove desc sort
        {:else}
          Sort Descending
        {/if}
      </span>
    </Button>
  </li>
  <li>
    <Button appearance="plain" on:click={toggleGroup}>
      <Icon class="opt" data={faThList}/>
      <span>
        {#if hasGrouping}
          Remove grouping
        {:else}
          Group by column
        {/if}
      </span>
    </Button>
  </li>
</ul>
