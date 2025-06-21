<script lang="ts">
  import {
    AttachableDropdown,
    Button,
    Icon,
    iconSearch,
  } from '@mathesar/component-library';
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

  // Focus the text input when dropdown is opened
  let textInputEl: HTMLInputElement | undefined;
  $: if (isOpen) {
    textInputEl?.focus();
  } else {
    filterString = '';
  }
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
    max-height: calc(100vh - 2rem);
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
    border-top: 1px solid var(--border-color);
  }
  .entity-switcher .trigger {
    color: var(--text-color-primary);
    border-radius: var(--border-radius-m);
    display: flex;
    align-items: center;
    padding: var(--sm4);

    &:hover {
      background-color: rgba(255, 117, 76, 0.15);
      color: var(--salmon-800);
    }

    &:active {
      background-color: rgba(255, 117, 76, 0.25);
      color: var(--salmon-800);
    }

    :global(body.theme-dark) &:hover {
      color: var(--salmon-200);
    }

    :global(body.theme-dark) &:active {
      color: var(--salmon-200);
    }
  }
</style>
