<script lang="ts">
  import type { Writable } from 'svelte/store';
  import { _ } from 'svelte-i18n';

  import type {
    JoinableTable,
    JoinableTablesResult,
  } from '@mathesar/api/rpc/tables';
  import {
    iconLinksFromOtherTables,
    iconLinksInThisTable,
  } from '@mathesar/icons';
  import type {
    AggregationType,
    RelatedColumnEntry,
    RelatedColumns,
  } from '@mathesar/stores/table-data';
  import { Icon } from '@mathesar-component-library';

  import RelatedTableNode from './RelatedTableNode.svelte';
  import type { TableNode } from './types';

  export let joinableTablesResult: JoinableTablesResult;
  export let relatedColumns: Writable<RelatedColumns>;

  // Group joinable tables by direction (forward FK vs reverse FK)
  $: forwardLinks = joinableTablesResult.joinable_tables.filter(
    (jt) => jt.depth === 1 && !jt.fkey_path[0][1],
  );

  $: reverseLinks = joinableTablesResult.joinable_tables.filter(
    (jt) => jt.depth === 1 && jt.fkey_path[0][1],
  );

  /**
   * Build a tree node for a table, including all its deeper linked tables
   * as children nodes.
   */
  function buildTableNode(joinableTable: JoinableTable): TableNode {
    const tableInfo =
      joinableTablesResult.target_table_info[joinableTable.target];
    const columns = Object.entries(tableInfo.columns).map(([id, col]) => ({
      columnId: parseInt(id, 10),
      columnName: col.name,
      columnType: col.type,
    }));

    // Find all tables that are one level deeper from this table
    const childJoinableTables = joinableTablesResult.joinable_tables.filter(
      (jt) => {
        // Must be exactly one level deeper
        if (jt.depth !== joinableTable.depth + 1) {
          return false;
        }
        // The join path must start with this table's join path
        const thisPathStr = JSON.stringify(joinableTable.join_path);
        const childPathStr = JSON.stringify(
          jt.join_path.slice(0, joinableTable.depth),
        );
        return thisPathStr === childPathStr;
      },
    );

    // Recursively build child nodes
    const children = childJoinableTables.map(buildTableNode);

    return {
      tableOid: joinableTable.target,
      tableName: tableInfo.name,
      joinableTable,
      columns,
      children,
    };
  }

  $: forwardTableNodes = forwardLinks.map(buildTableNode);
  $: reverseTableNodes = reverseLinks.map(buildTableNode);

  function toggleColumn(
    joinableTable: JoinableTable,
    columnId: number,
    aggregation?: AggregationType,
  ) {
    // Check if this column is already selected
    const isSelected = $relatedColumns.entries.some(
      (e) =>
        e.columnId === columnId &&
        JSON.stringify(e.joinPath) === JSON.stringify(joinableTable.join_path),
    );

    if (isSelected) {
      const entry: RelatedColumnEntry = {
        joinPath: joinableTable.join_path,
        columnId,
        multipleResults: joinableTable.multiple_results,
        aggregation: joinableTable.multiple_results ? aggregation : undefined,
      };
      relatedColumns.update((rc) => rc.withoutMatchingEntry(entry));
    } else {
      // For many-to-many relationships, default to 'list' if no aggregation specified
      const defaultAggregation =
        joinableTable.multiple_results && !aggregation ? 'list' : aggregation;
      const entry: RelatedColumnEntry = {
        joinPath: joinableTable.join_path,
        columnId,
        multipleResults: joinableTable.multiple_results,
        aggregation: joinableTable.multiple_results
          ? defaultAggregation
          : undefined,
      };
      relatedColumns.update((rc) => rc.withEntry(entry));
    }
  }

  function updateColumnAggregation(
    joinableTable: JoinableTable,
    columnId: number,
    aggregation: AggregationType,
  ) {
    const entry: RelatedColumnEntry = {
      joinPath: joinableTable.join_path,
      columnId,
      multipleResults: joinableTable.multiple_results,
      aggregation,
    };

    // Remove the old entry and add the new one with updated aggregation
    relatedColumns.update((rc) =>
      rc.withoutMatchingEntry(entry).withEntry(entry),
    );
  }
</script>

<div class="related-columns-tree">
  {#if forwardTableNodes.length === 0 && reverseTableNodes.length === 0}
    <div class="empty-state">
      {$_('no_related_tables_found')}
    </div>
  {/if}

  {#if forwardTableNodes.length > 0}
    <section class="direction-section">
      <h4 class="section-header">
        <Icon {...iconLinksInThisTable} size="0.9em" />
        <span>{$_('links_from_this_table')}</span>
      </h4>
      <div class="tables-list">
        {#each forwardTableNodes as tableNode (tableNode.tableOid)}
          <RelatedTableNode
            {tableNode}
            {joinableTablesResult}
            {relatedColumns}
            onToggle={toggleColumn}
            onAggregationChange={updateColumnAggregation}
          />
        {/each}
      </div>
    </section>
  {/if}

  {#if reverseTableNodes.length > 0}
    <section class="direction-section">
      <h4 class="section-header">
        <Icon {...iconLinksFromOtherTables} size="0.9em" />
        <span>{$_('links_to_this_table')}</span>
      </h4>
      <div class="tables-list">
        {#each reverseTableNodes as tableNode (tableNode.tableOid)}
          <RelatedTableNode
            {tableNode}
            {joinableTablesResult}
            {relatedColumns}
            onToggle={toggleColumn}
            onAggregationChange={updateColumnAggregation}
          />
        {/each}
      </div>
    </section>
  {/if}
</div>

<style lang="scss">
  .related-columns-tree {
    display: flex;
    flex-direction: column;
    gap: var(--lg2);
  }

  .empty-state {
    padding: var(--lg3);
    text-align: center;
    color: var(--color-fg-muted);
    font-size: var(--md1);
    background-color: var(--color-bg);
    border: 1px dashed var(--color-border);
    border-radius: var(--border-radius-m);
  }

  .direction-section {
    display: flex;
    flex-direction: column;
    gap: var(--md1);
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: var(--sm4);
    margin: 0;
    font-size: var(--sm1);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-fg-muted);
    padding: var(--sm4) var(--md1);
    background-color: var(--color-bg);
    border-radius: var(--border-radius-s);
    border-left: 3px solid var(--color-primary-muted);
  }

  .tables-list {
    display: flex;
    flex-direction: column;
    gap: var(--md1);
  }
</style>
