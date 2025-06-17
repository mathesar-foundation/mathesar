<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';

  import type { Column } from '@mathesar/api/rpc/columns';

  import type RowSeekerController from './RowSeekerController';
  import RowSeekerFilterTag from './RowSeekerFilterTag.svelte';

  export let columnsArray: Column[];
  export let controller: RowSeekerController;

  $: columnMap = new Map(columnsArray.map((cr) => [cr.id, cr]));
  $: ({ filters, searchValue } = controller);

  let searchElement: HTMLInputElement;

  const dispatch = createEventDispatcher<{
    artificialKeydown: KeyboardEvent;
  }>();

  function onKeyDown(e: KeyboardEvent) {
    dispatch('artificialKeydown', e);
  }
</script>

<div
  class="search-box"
  data-row-seeker-search
  on:click={() => searchElement.focus()}
>
  <div class="tags">
    {#each [...$filters.entries()] as filter (filter)}
      <RowSeekerFilterTag {controller} {columnMap} {filter} />
    {/each}
  </div>
  <input
    bind:this={searchElement}
    bind:value={$searchValue}
    class="search-bar"
    type="text"
    placeholder={$_('search')}
    on:input={() => controller.getRecords()}
    on:keydown={onKeyDown}
  />
</div>

<style lang="scss">
  .search-box {
    flex-grow: 1;
    padding: var(--sm2);
    padding-bottom: var(--sm4);
    display: flex;
    flex-wrap: wrap;
  }

  .tags {
    display: inline-block;
    margin-right: var(--sm5);
  }

  .search-bar {
    display: inline-flex;
    border: none;
    padding: 0;
    line-height: var(--input-line-height);
    margin-bottom: var(--sm5);
    background: inherit;
    color: var(--input-text);
    flex-grow: 1;

    &::placeholder {
      color: var(--text-color-tertiary);
    }

    &:focus {
      outline: 0;
    }
  }
</style>
