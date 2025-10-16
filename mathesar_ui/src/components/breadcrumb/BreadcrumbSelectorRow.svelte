<script lang="ts">
  import { MatchHighlighter } from '@mathesar/component-library';
  import DatabaseDisplayNameWithIcon from '@mathesar/components/DatabaseDisplayNameWithIcon.svelte';
  import DataFormName from '@mathesar/components/DataFormName.svelte';
  import NameWithIcon from '@mathesar/components/NameWithIcon.svelte';
  import QueryName from '@mathesar/components/QueryName.svelte';
  import SchemaName from '@mathesar/components/SchemaName.svelte';
  import TableName from '@mathesar/components/TableName.svelte';
  import RecordSelectorNavigationButton from '@mathesar/systems/record-selector/RecordSelectorNavigationButton.svelte';

  import type { BreadcrumbSelectorEntry } from './breadcrumbTypes';

  export let entry: BreadcrumbSelectorEntry;
  export let filterString = '';
  export let closeSelector: () => void;
</script>

<li class="breadcrumb-selector-row" class:active={entry.isActive()}>
  <div class="hover-indicator" />
  <a href={entry.href} on:click={closeSelector}>
    {#if entry.type === 'table'}
      <TableName table={entry.table} let:tableName>
        <MatchHighlighter text={tableName} substring={filterString} />
      </TableName>
    {:else if entry.type === 'exploration'}
      <QueryName query={entry.exploration} let:queryName>
        <MatchHighlighter text={queryName} substring={filterString} />
      </QueryName>
    {:else if entry.type === 'database'}
      <DatabaseDisplayNameWithIcon
        database={entry.database}
        let:databaseDisplayName
      >
        <MatchHighlighter text={databaseDisplayName} substring={filterString} />
      </DatabaseDisplayNameWithIcon>
    {:else if entry.type === 'schema'}
      <SchemaName schema={entry.schema} let:schemaName>
        <MatchHighlighter text={schemaName} substring={filterString} />
      </SchemaName>
    {:else if entry.type === 'dataForm'}
      <DataFormName dataForm={entry.dataForm} let:dataFormName>
        <MatchHighlighter text={dataFormName} substring={filterString} />
      </DataFormName>
    {:else}
      <NameWithIcon icon={entry.icon}>
        <MatchHighlighter text={entry.label} substring={filterString} />
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
    padding: var(--sm6) var(--sm3);
    color: var(--color-fg-navigation);
    text-decoration: none;
    position: relative;
    --name-color: var(--color-fg-navigation);
  }

  .hover-indicator {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: var(--color-navigation-20-hover);
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  .breadcrumb-selector-row:hover .hover-indicator {
    opacity: 1;
  }

  .record-selector {
    flex: 0 0 2rem;
    display: flex;
    align-items: stretch;
    position: relative;
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
