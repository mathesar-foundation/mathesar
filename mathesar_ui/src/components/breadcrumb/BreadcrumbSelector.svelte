<script lang="ts">
  import { AttachableDropdown, TextInput } from '@mathesar/component-library';
  import BreadcrumbSelectorRow from './BreadcrumbSelectorRow.svelte';
  import BreadcrumbSeparatorIcon from './BreadcrumbSeparatorIcon.svelte';
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
  }

  // Filter the selector data based on text input
  $: processedData = filterString
    ? filterBreadcrumbSelectorData(data, filterString)
    : data;
</script>

<div class="entity-switcher" class:is-open={isOpen}>
  <button
    class="trigger passthrough-button"
    bind:this={triggerElement}
    on:click={() => {
      isOpen = !isOpen;
    }}
    aria-label={triggerLabel}
    title={triggerLabel}
  >
    <BreadcrumbSeparatorIcon />
  </button>

  <AttachableDropdown
    bind:isOpen
    trigger={triggerElement}
    class="breadcrumb-selector-dropdown"
  >
    <div class="entity-switcher-content">
      <div class="search">
        <TextInput bind:value={filterString} bind:element={textInputEl} />
      </div>
      <div class="results">
        {#each [...processedData] as [categoryName, entries] (categoryName)}
          <!-- data coming down from parent can have categories with 0 items: we
        don't want to render that. -->
          {#if entries.length > 0}
            <div class="section-name">{categoryName}</div>
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
        {/each}
      </div>
    </div>
  </AttachableDropdown>
</div>

<style>
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
    font-size: var(--text-size-x-small);
    margin: 0.25rem 0;

    color: var(--color-text-muted);
    text-transform: uppercase;
  }
  .items {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  /* TODO: reduce code duplication with this CSS used elsewhere. */
  .passthrough-button {
    background: inherit;
    border-radius: inherit;
    border: inherit;
    color: inherit;
    cursor: inherit;
    font-family: inherit;
    font-size: inherit;
    font-weight: inherit;
    text-align: inherit;
    margin: 0;
    padding: 0;
  }
  .entity-switcher .trigger {
    --background-color: var(--color-gray-lighter);
    --border-color: var(--color-gray-dark);
    display: block;
    cursor: pointer;
  }
  .entity-switcher .trigger :global(svg) {
    height: 1.8rem;
    display: block;
  }
  .entity-switcher .trigger:hover,
  .entity-switcher.is-open .trigger {
    --background-color: var(--color-contrast);
    --icon-color: white;
    --border-color: var(--color-contrast);
  }
</style>
