<script lang="ts">
  import {
    AttachableDropdown,
    Button,
    Icon,
    iconSearch,
  } from '@mathesar/component-library';
  import TextInputWithPrefix from '@mathesar/component-library/text-input/TextInputWithPrefix.svelte';
  import { iconExpandRight } from '@mathesar/icons';
  import BreadcrumbSelectorRow from './BreadcrumbSelectorRow.svelte';
  import type { BreadcrumbSelectorData } from './breadcrumbTypes';
  import { filterBreadcrumbSelectorData } from './breadcrumbUtils';

  export let data: BreadcrumbSelectorData;
  export let triggerLabel: string;

  let triggerElement: HTMLButtonElement;
  let isOpen = false;
  let filterString: string;

  // Focus the text input when dropdown is opened
  let textInputEl: HTMLInputElement | undefined;
  $: if (isOpen) {
    textInputEl?.focus();
  } else {
    filterString = '';
  }

  // Filter the selector data based on text input
  $: processedData = filterString
    ? filterBreadcrumbSelectorData(data, filterString)
    : data;
</script>

<div class="entity-switcher" class:is-open={isOpen}>
  <Button
    on:click={() => {
      isOpen = !isOpen;
    }}
    aria-label={triggerLabel}
    title={triggerLabel}
    appearance="ghost"
    bind:element={triggerElement}
    class="padding-zero"
  >
    <span class="trigger">
      <Icon {...iconExpandRight} />
    </span>
  </Button>

  <AttachableDropdown
    bind:isOpen
    trigger={triggerElement}
    class="breadcrumb-selector-dropdown"
  >
    <div class="entity-switcher-content">
      <div class="search">
        <TextInputWithPrefix
          prefixIcon={iconSearch}
          bind:value={filterString}
          bind:element={textInputEl}
        />
      </div>
      <div class="results">
        {#each [...processedData] as [categoryName, entries] (categoryName)}
          <!-- data coming down from parent can have categories with 0 items: we
        don't want to render that. -->
          {#if entries.length > 0}
            <div class="section-name">
              {#if filterString?.length === 0}
                {categoryName}
              {:else}
                {`${entries.length} match${
                  entries.length > 1 ? 's' : ''
                } for '${filterString}' ${
                  processedData.size > 1 ? `in ${categoryName}` : ''
                }`}
              {/if}
            </div>
            <ul class="items">
              {#each entries as entry (entry.href)}
                <BreadcrumbSelectorRow
                  {entry}
                  {filterString}
                  closeSelector={() => {
                    isOpen = false;
                  }}
                />
              {/each}
            </ul>
          {/if}
        {:else}
          {#if filterString.length > 0}
            <div class="section-name">
              No matches for '{filterString}'
            </div>
          {/if}
        {/each}
      </div>
    </div>
  </AttachableDropdown>
</div>

<style lang="scss">
  :global(.breadcrumb-selector-dropdown) {
    display: flex;
  }
  .entity-switcher-content {
    padding: 0.5rem;
    min-width: 12rem;
    display: grid;
    grid-template: auto 1fr / 1fr;
    grid-gap: 0.5rem;
  }
  .results {
    overflow-y: auto;
  }
  .section-name {
    margin: 0.25rem 0;
  }
  .items {
    list-style: none;
    padding-left: 0.5rem;
    margin: 0;
  }
  .entity-switcher .trigger {
    border: 1px solid var(--slate-500);
    color: var(--slate-400);
    border-radius: var(--border-radius-m);
    display: flex;
    align-items: center;
    padding: 0.25rem;

    &:hover,
    &:active {
      background-color: var(--slate-100);
      color: var(--slate-500);
      border-color: var(--slate-300);
    }
  }
</style>
