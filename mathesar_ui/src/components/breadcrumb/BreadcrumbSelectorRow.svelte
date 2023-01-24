<script lang="ts">
  import { MatchHighlighter } from '@mathesar/component-library';
  import NameWithIcon from '@mathesar/components/NameWithIcon.svelte';
  import RecordSelectorNavigationButton from '@mathesar/systems/record-selector/RecordSelectorNavigationButton.svelte';
  import TableName from '../TableName.svelte';
  import type { BreadcrumbSelectorEntry } from './breadcrumbTypes';

  export let entry: BreadcrumbSelectorEntry;
  export let filterString = '';
  export let closeSelector: () => void;

  $: ({ href, icon, label } = entry);
</script>

<li class="breadcrumb-selector-row" class:active={entry.isActive()}>
  <a {href} on:click={closeSelector}>
    {#if 'table' in entry}
      <TableName table={entry.table} />
    {:else}
      <NameWithIcon {icon}>
        <MatchHighlighter text={label} substring={filterString} />
      </NameWithIcon>
    {/if}
  </a>
  {#if entry.type === 'table'}
    <div class="record-selector">
      <RecordSelectorNavigationButton
        table={entry.table}
        on:click={closeSelector}
      />
    </div>
  {/if}
  <div class="hover-indicator" />
</li>

<style>
  .breadcrumb-selector-row {
    position: relative;
    display: flex;
    overflow: hidden;
    border-radius: var(--border-radius-m);
  }
  .breadcrumb-selector-row.active {
    background-color: hsla(0, 0%, 0%, 0.1);
  }
  .breadcrumb-selector-row a {
    flex: 1 1 auto;
    display: block;
    padding: 0.25rem 0.5rem;
    color: inherit;
    text-decoration: none;
  }

  .hover-indicator {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: var(--color-contrast-light);
    mix-blend-mode: multiply;
    pointer-events: none;
  }
  .breadcrumb-selector-row:not(:hover) .hover-indicator {
    display: none;
  }

  .record-selector {
    flex: 0 0 2rem;
    display: flex;
    align-items: stretch;
  }
  .record-selector > :global(*) {
    flex: 1;
  }
  @media (hover: hover) {
    .breadcrumb-selector-row:not(:hover) .record-selector {
      visibility: hidden;
    }
  }
</style>
