<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';

  import type { Column } from '@mathesar/api/rpc/columns';
  import { Icon } from '@mathesar/component-library';
  import { iconAddFilter } from '@mathesar/icons';

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

<div class="search-container">
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

  <div class="drilldown">
    <Icon {...iconAddFilter} />
  </div>
</div>

<style lang="scss">
  .search-container {
    flex-grow: 1;
    display: flex;
  }

  .search-box {
    flex-grow: 1;
    padding: var(--input-padding);
    padding-bottom: var(--sm4);
  }

  .tags {
    display: inline-block;
    margin-right: var(--sm5);
  }

  .drilldown {
    color: var(--gray-500);
    font-size: var(--sm1);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 var(--sm3);
  }

  .search-bar {
    display: inline-flex;
    border: none;
    padding: 0;
    line-height: var(--input-line-height);
    margin-bottom: var(--sm5);

    &::placeholder {
      color: var(--text-color-tertiary);
    }

    &:focus {
      outline: 0;
    }
  }
</style>
