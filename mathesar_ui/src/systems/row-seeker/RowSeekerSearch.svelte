<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type RowSeekerController from './RowSeekerController';

  export let controller: RowSeekerController;
  export let onKeyDown: (e: KeyboardEvent) => void;

  $: ({ searchValue } = controller);

  let searchElement: HTMLInputElement;
</script>

<div
  class="search-box"
  data-row-seeker-search
  on:click={() => searchElement.focus()}
>
  <input
    bind:this={searchElement}
    bind:value={$searchValue}
    class="search-bar"
    type="text"
    data-row-seeker-search-box
    placeholder={$_('search')}
    on:input={() => controller.resetPaginationAndGetRecords()}
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
