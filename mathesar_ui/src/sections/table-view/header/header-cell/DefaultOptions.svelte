<script lang="ts">
  import {
    faSortAmountDown,
    faSortAmountDownAlt,
    faThList,
  } from '@fortawesome/free-solid-svg-icons';
  import { Icon } from '@mathesar-components';
  import type {
    Meta,
    Column,
    SortOption,
    GroupOption,
  } from '@mathesar/stores/table-data/types';

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
  }

  function toggleGroup() {
    if (hasGrouping) {
      meta.removeGroup(column.name);
    } else {
      meta.addGroup(column.name);
    }
  }
</script>

<ul>
  <li on:click={() => handleSort('asc')}>
    <Icon class="opt" data={faSortAmountDownAlt}/>
    <span>
      {#if sortDirection === 'asc'}
        Remove asc sort
      {:else}
        Sort Ascending
      {/if}
    </span>
  </li>
  <li on:click={() => handleSort('desc')}>
    <Icon class="opt" data={faSortAmountDown}/>
    <span>
      {#if sortDirection === 'desc'}
        Remove desc sort
      {:else}
        Sort Descending
      {/if}
    </span>
  </li>
  <li on:click={toggleGroup}>
    <Icon class="opt" data={faThList}/>
    <span>
      {#if hasGrouping}
        Remove grouping
      {:else}
        Group by column
      {/if}
    </span>
  </li>
</ul>
