<script lang="ts">
  import { Collapsible, Spinner } from '@mathesar-component-library';
  import type { CancellablePromise } from '@mathesar-component-library/types';
  import type {
    TableEntry,
    JoinableTableResult,
  } from '@mathesar/api/tables/tableList';
  import { getAPI } from '@mathesar/utils/api';
  import type { RequestStatus } from '@mathesar/utils/api';
  import CacheManager from '@mathesar/utils/CacheManager';
  import {
    getBaseTableColumnsWithLinks,
    getTablesThatReferenceBaseTable,
  } from './selectionPaneUtils';
  import type { ColumnWithLink, ReferencedByTable } from './selectionPaneUtils';
  import SelectableColumnTree from './SelectableColumnTree.svelte';

  export let baseTable: TableEntry | undefined;

  let fetchPromise: CancellablePromise<JoinableTableResult> | undefined;
  let requestStatus: RequestStatus = { state: 'processing' };
  let baseTableColumns: ColumnWithLink[] = [];
  let tablesThatReferenceBaseTable: ReferencedByTable[];

  const cacheManager = new CacheManager<
    number,
    {
      baseTableColumns: ColumnWithLink[];
      tablesThatReferenceBaseTable: ReferencedByTable[];
    }
  >(5);

  async function generateTree(_baseTable: TableEntry | undefined) {
    fetchPromise?.cancel();

    if (!_baseTable) {
      baseTableColumns = [];
      tablesThatReferenceBaseTable = [];
      requestStatus = { state: 'success' };
      return;
    }

    const cachedResult = cacheManager.get(_baseTable.id);
    if (cachedResult) {
      ({ baseTableColumns, tablesThatReferenceBaseTable } = cachedResult);
      requestStatus = { state: 'success' };
      return;
    }

    try {
      requestStatus = { state: 'processing' };
      fetchPromise = getAPI<JoinableTableResult>(
        `/api/db/v0/tables/${_baseTable.id}/joinable_tables/`,
      );
      const result = await fetchPromise;
      baseTableColumns = getBaseTableColumnsWithLinks(result, _baseTable);
      tablesThatReferenceBaseTable = getTablesThatReferenceBaseTable(
        result,
        _baseTable,
      );
      cacheManager.set(_baseTable.id, {
        baseTableColumns,
        tablesThatReferenceBaseTable,
      });
      requestStatus = { state: 'success' };
    } catch (err: unknown) {
      const error =
        err instanceof Error
          ? err.message
          : 'There was an error fetching joinable links';
      requestStatus = {
        state: 'failure',
        errors: [error],
      };
    }
  }

  $: void generateTree(baseTable);
</script>

<div class="column-selection-pane">
  {#if requestStatus.state === 'success'}
    <SelectableColumnTree columnsWithLinks={baseTableColumns} on:add />
    {#if tablesThatReferenceBaseTable.length > 0}
      <div data-id="referenced-by-tables">
        {#each tablesThatReferenceBaseTable as table (table.id)}
          <Collapsible>
            <div slot="header" class="column-name">
              <div>{table.name}</div>
              <div>
                {table.referencedViaColumn.name} -> {table.linkedToColumn.name}
              </div>
            </div>
            <div class="column-list" slot="content">
              <SelectableColumnTree columnsWithLinks={table.columns} on:add />
            </div>
          </Collapsible>
        {/each}
      </div>
    {/if}
  {:else if requestStatus.state === 'failure'}
    {requestStatus.errors.join(' ')}
  {:else}
    <Spinner />
  {/if}
</div>

<style lang="scss">
  .column-selection-pane {
    position: relative;
    padding: 0.75rem;
    flex-grow: 1;
    overflow: auto;

    :global(.collapsible) {
      margin: 0.7rem 0;
    }
    :global(.collapsible .collapsible-header) {
      padding: 0.5rem 0.75rem;
      border: 1px solid #dfdfdf;
      border-radius: 2px;
      margin: 0.7rem 0;
      cursor: pointer;
      display: flex;
      align-items: center;
    }
    :global(.collapsible .collapsible-content .column-list) {
      margin-top: 0.7rem;
      margin-left: 1rem;
    }
    [data-id='referenced-by-tables'] {
      border-top: 2px solid #dfdfdf;
      margin-top: 1.2rem;
      padding-top: 0.3rem;
    }
  }
</style>
