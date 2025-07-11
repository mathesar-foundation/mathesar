<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { RichText } from '@mathesar/components/rich-text';
  import { filterViaTextQuery } from '@mathesar-component-library';

  import BreadcrumbSelectorRow from './BreadcrumbSelectorRow.svelte';
  import type { BreadcrumbSelectorSectionData } from './breadcrumbTypes';

  export let section: BreadcrumbSelectorSectionData;
  export let filterString: string;
  export let closeSelector: () => void;

  $: ({ label, entries, emptyMessage } = section);
  $: filteredEntries = [
    ...filterViaTextQuery(entries, filterString, (e) => e.label),
  ];
</script>

<div class="breadcrumb-selector-section">
  <div class="label">{label}</div>
  <div class="content">
    <div class="detail">
      {#if filterString && filteredEntries.length}
        <RichText
          text={$_('number_of_matches', {
            values: { count: filteredEntries.length },
          })}
          let:slotName
        >
          {#if slotName === 'searchValue'}
            <b>{filterString}</b>
          {/if}
        </RichText>
      {:else if filterString && !filteredEntries.length}
        <RichText text={$_('no_matches')} let:slotName>
          {#if slotName === 'searchValue'}
            <b>{filterString}</b>
          {/if}
        </RichText>
      {:else if !filteredEntries.length}
        {emptyMessage}
      {/if}
    </div>

    <ul class="items">
      {#each filteredEntries as entry (entry.href)}
        <BreadcrumbSelectorRow {entry} {filterString} {closeSelector} />
      {/each}
    </ul>
  </div>
</div>

<style>
  .breadcrumb-selector-section {
    display: grid;
    grid-gap: var(--sm4);
  }
  .content {
    display: grid;
    grid-gap: var(--sm4);
  }
  .detail {
    color: var(--text-color-secondary);
    font-size: var(--sm1);
  }
  .detail:empty {
    display: none;
  }
  .items {
    list-style: none;
    margin: 0;
    padding: 0;
  }
</style>
