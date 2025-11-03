<script lang="ts">
  import {
    AttachableDropdown,
    Button,
    Icon,
    filterViaTextQuery,
    iconSearch,
  } from '@mathesar/component-library';
  import focusTrap from '@mathesar/component-library/common/actions/focusTrap';
  import TextInputWithPrefix from '@mathesar/component-library/text-input/TextInputWithPrefix.svelte';
  import { iconExpandRight } from '@mathesar/icons';
  import { modal } from '@mathesar/stores/modal';

  import ConnectDatabaseModal from '../../systems/databases/create-database/ConnectDatabaseModal.svelte';

  import BreadcrumbSelectorRow from './BreadcrumbSelectorRow.svelte';
  import BreadcrumbSelectorSection from './BreadcrumbSelectorSection.svelte';
  import type {
    BreadcrumbSelectorEntry,
    BreadcrumbSelectorSectionData,
  } from './breadcrumbTypes';

  const connectDatabaseModalController = modal.spawnModalController();

  export let sections: BreadcrumbSelectorSectionData[];
  export let triggerLabel: string;
  export let persistentLinks: BreadcrumbSelectorEntry[] = [];

  let triggerElement: HTMLButtonElement;
  let isOpen = false;
  let filterString: string;
  let contentElement: HTMLDivElement | undefined;
  let selectedIndex = -1;

  // Focus the text input when dropdown is opened
  let textInputEl: HTMLInputElement | undefined;
  $: isOpen, (filterString = '');

  // Get all filtered entries for keyboard navigation
  $: allFilteredEntries = [
    ...sections.flatMap((section) =>
      Array.from(
        filterViaTextQuery(section.entries, filterString, (e) =>
          e.getFilterableText(),
        ),
      ),
    ),
    ...persistentLinks,
  ];
  $: allFilteredEntries, (selectedIndex = -1);

  function scrollToSelected() {
    if (selectedIndex >= 0 && contentElement) {
      const links = contentElement.querySelectorAll(
        '.breadcrumb-selector-row a',
      );
      const selectedLink = links[selectedIndex] as HTMLElement;
      if (selectedLink) {
        selectedLink.focus();
        selectedLink.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (!isOpen) {
      return;
    }

    const target = event.target as HTMLElement;
    const isSearchInput = target === textInputEl;

    if (event.key === 'Escape') {
      event.preventDefault();
      isOpen = false;
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (selectedIndex >= allFilteredEntries.length - 1) {
        // Loop back to search input, then to first item
        selectedIndex = -1;
        textInputEl?.focus();
      } else {
        selectedIndex += 1;
        scrollToSelected();
      }
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (selectedIndex === -1) {
        // From search input, go to last item
        selectedIndex = allFilteredEntries.length - 1;
        scrollToSelected();
      } else if (selectedIndex === 0) {
        // From first item, go to search input
        selectedIndex = -1;
        textInputEl?.focus();
      } else {
        selectedIndex -= 1;
        scrollToSelected();
      }
      return;
    }

    // For alphanumeric keys and editing keys, focus the search input
    // This works when an anchor link is focused
    if (
      !isSearchInput &&
      (event.key.length === 1 ||
        event.key === 'Backspace' ||
        event.key === 'Delete')
    ) {
      textInputEl?.focus();
    }
  }
</script>

<svelte:window on:keydown={handleKeyDown} />

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
    <div
      class="entity-switcher-content"
      bind:this={contentElement}
      use:focusTrap
    >
      <div class="search">
        <TextInputWithPrefix
          prefixIcon={iconSearch}
          bind:value={filterString}
          bind:element={textInputEl}
        />
      </div>
      <div class="sections">
        {#each sections as section (section.label)}
          <BreadcrumbSelectorSection
            {section}
            {filterString}
            closeSelector={() => {
              isOpen = false;
            }}
          />
        {/each}
      </div>
      {#if persistentLinks.length}
        <ul class="actions">
          {#each persistentLinks as entry (entry.href)}
            <BreadcrumbSelectorRow
              {entry}
              closeSelector={() => {
                isOpen = false;
              }}
            />
          {/each}
        </ul>
      {/if}
    </div>
  </AttachableDropdown>
</div>

<ConnectDatabaseModal controller={connectDatabaseModalController} />

<style lang="scss">
  .entity-switcher :global(.breadcrumb-selector-dropdown) {
    display: flex;
  }
  .entity-switcher-content {
    padding: var(--sm4);
    min-width: 12rem;
    display: grid;
    grid-template: auto 1fr / 1fr;
    grid-gap: var(--sm4);
    max-height: calc(100svh - 2rem);
  }
  .sections {
    overflow-y: auto;
    display: grid;
    grid-gap: var(--sm4);
  }
  .actions {
    list-style: none;
    margin: 0;
  }
  .actions {
    margin-top: var(--sm5);
    padding-left: 0;
    padding-top: var(--sm5);
    border-top: 1px solid var(--color-border-section);
  }
  .entity-switcher .trigger {
    color: var(--color-fg-navigation);
    border-radius: var(--border-radius-m);
    display: flex;
    align-items: center;
    padding: var(--sm4);

    &:hover {
      background-color: var(--color-bg-raised-1-hover);
      color: var(--color-fg-navigation-hover);
      border-color: var(--color-border-raised-1-hover);
    }
  }

  .entity-switcher:has(button:focus) {
    .trigger {
      background-color: var(--color-bg-raised-1-focused);
      color: var(--color-fg-navigation-focused);
      border-color: var(--color-border-raised-1-focused);
      box-shadow: inset 0 0 2px 1px var(--color-shadow);
    }
  }
</style>
