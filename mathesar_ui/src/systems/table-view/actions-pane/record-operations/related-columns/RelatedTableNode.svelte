<script lang="ts">
  import type { Writable } from 'svelte/store';

  import type {
    JoinableTable,
    JoinableTablesResult,
  } from '@mathesar/api/rpc/tables';
  import Collapsible from '@mathesar/component-library/collapsible/Collapsible.svelte';
  import { iconTable } from '@mathesar/icons';
  import type {
    AggregationType,
    RelatedColumns,
  } from '@mathesar/stores/table-data';
  import { Checkbox, Icon, Select } from '@mathesar-component-library';

  import type { TableNode } from './types';

  export let tableNode: TableNode;
  export let depth = 0;
  export let joinableTablesResult: JoinableTablesResult;
  export let relatedColumns: Writable<RelatedColumns>;
  export let onToggle: (
    joinableTable: JoinableTable,
    columnId: number,
    aggregation?: AggregationType,
  ) => void;
  export let onAggregationChange: (
    joinableTable: JoinableTable,
    columnId: number,
    aggregation: AggregationType,
  ) => void;

  let isOpen = false;

  const aggregationOptions: Array<{
    value: AggregationType;
    label: string;
  }> = [
    { value: 'list', label: 'List' },
    { value: 'count', label: 'Count' },
  ];

  function handleColumnToggle(columnId: number) {
    const currentAgg = selectedColumnsMap.get(columnId);
    onToggle(tableNode.joinableTable, columnId, currentAgg ?? 'list');
  }

  function handleAggregationChange(
    columnId: number,
    event: CustomEvent<{ value: AggregationType; label: string } | undefined>,
  ) {
    const newAggregation = event.detail?.value;
    if (newAggregation) {
      onAggregationChange(tableNode.joinableTable, columnId, newAggregation);
    }
  }

  $: isManyToMany = tableNode.joinableTable.multiple_results;
  $: hasChildren = tableNode.children.length > 0;

  // Calculate depth-based styling
  $: depthColor = `hsl(var(--color-primary-hue), ${Math.max(
    10,
    40 - depth * 5,
  )}%, ${Math.min(98, 96 + depth * 1)}%)`;
  $: borderColor =
    depth > 0 ? 'var(--color-border-muted)' : 'var(--color-border)';

  // Create a reactive map of selected columns for this table
  $: selectedColumnsMap = new Map(
    $relatedColumns.entries
      .filter(
        (entry) =>
          JSON.stringify(entry.joinPath) ===
          JSON.stringify(tableNode.joinableTable.join_path),
      )
      .map((entry) => [entry.columnId, entry.aggregation]),
  );

  // Get the selected aggregation option object for a column
  $: getAggregationOption = (columnId: number) => {
    const agg = selectedColumnsMap.get(columnId);
    return aggregationOptions.find((opt) => opt.value === (agg ?? 'list'));
  };
</script>

<div
  class="table-node"
  class:nested={depth > 0}
  style="--depth-bg: {depthColor}; --depth-border: {borderColor}"
>
  <Collapsible bind:isOpen>
    <span slot="header" class="table-header">
      {#if depth > 0}
        <span class="depth-indicator" title="Depth level {depth}">
          {#each Array(depth) as _, i (i)}
            <span class="depth-dot" />
          {/each}
        </span>
      {/if}
      <Icon {...iconTable} size="0.9em" />
      <span class="table-name">{tableNode.tableName}</span>
      {#if isManyToMany}
        <span class="badge">Many</span>
      {/if}
      {#if depth > 0}
        <span class="depth-label">Level {depth}</span>
      {/if}
    </span>

    <div class="columns-list" slot="content">
      {#each tableNode.columns as column (column.columnId)}
        {@const isSelected = selectedColumnsMap.has(column.columnId)}
        {@const aggregation = selectedColumnsMap.get(column.columnId)}
        <div class="column-item">
          <label class="column-label">
            <Checkbox
              checked={isSelected}
              on:change={() => handleColumnToggle(column.columnId)}
            />
            <span class="column-name">{column.columnName}</span>
            <span class="column-type">{column.columnType}</span>
          </label>

          {#if isManyToMany && isSelected}
            <div class="aggregation-selector">
              <Select
                options={aggregationOptions}
                value={getAggregationOption(column.columnId)}
                on:change={(e) => handleAggregationChange(column.columnId, e)}
                size="small"
              />
            </div>
          {/if}
        </div>
      {/each}

      {#if hasChildren}
        <div class="nested-tables">
          <div class="nesting-connector" />
          {#each tableNode.children as childNode (childNode.tableOid + JSON.stringify(childNode.joinableTable.join_path))}
            <svelte:self
              tableNode={childNode}
              {joinableTablesResult}
              {relatedColumns}
              {onToggle}
              {onAggregationChange}
              depth={depth + 1}
            />
          {/each}
        </div>
      {/if}
    </div>
  </Collapsible>
</div>

<style lang="scss">
  .table-node {
    border: 1px solid var(--depth-border, var(--color-border));
    border-radius: var(--border-radius-m);
    overflow: hidden;
    background-color: var(--color-bg);
    position: relative;
    transition: all 0.2s ease;

    &.nested {
      border-left-width: 3px;
      border-left-color: var(--color-primary-muted);
      box-shadow:
        -2px 0 0 0 var(--color-bg-raised),
        -3px 0 0 0 var(--color-border-muted);
    }

    &:hover {
      border-color: var(--color-primary-light);
    }
  }

  .table-header {
    display: flex;
    align-items: center;
    gap: var(--sm4);
    font-weight: 500;
    padding: var(--sm4) var(--md1);
    background: linear-gradient(
      to bottom,
      var(--depth-bg, var(--color-bg)),
      var(--color-bg)
    );
    border-bottom: 1px solid var(--color-border-muted);

    .depth-indicator {
      display: flex;
      align-items: center;
      gap: 2px;
      margin-right: var(--sm4);
      padding: 2px 6px;
      background-color: var(--color-primary-bg);
      border-radius: var(--border-radius-s);

      .depth-dot {
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background-color: var(--color-primary);
      }
    }

    .table-name {
      flex: 1;
      font-size: var(--md1);
    }

    .badge {
      font-size: var(--sm2);
      padding: 0.15rem 0.5rem;
      border-radius: var(--border-radius-s);
      background-color: var(--color-warning-bg);
      color: var(--color-warning-fg);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    .depth-label {
      font-size: var(--sm2);
      padding: 0.15rem 0.5rem;
      border-radius: var(--border-radius-s);
      background-color: var(--color-primary-bg);
      color: var(--color-primary);
      font-weight: 500;
      opacity: 0.7;
    }
  }

  .columns-list {
    display: flex;
    flex-direction: column;
    gap: var(--sm2);
    padding: var(--md1);
    background-color: var(--color-bg);
  }

  .column-item {
    display: flex;
    flex-direction: column;
    gap: var(--sm3);
  }

  .column-label {
    display: flex;
    align-items: center;
    gap: var(--sm4);
    cursor: pointer;
    padding: var(--sm3) var(--sm4);
    border-radius: var(--border-radius-s);

    &:hover {
      background-color: var(--color-bg-raised-2);
    }

    .column-name {
      flex: 1;
      font-size: var(--sm1);
    }

    .column-type {
      font-size: var(--sm2);
      color: var(--color-fg-muted);
      font-family: var(--font-family-mono);
    }
  }

  .aggregation-selector {
    padding-left: calc(var(--sm4) + 1.2em);
    padding-right: var(--sm4);

    :global(.select) {
      width: 120px;
    }
  }

  .nested-tables {
    margin-top: var(--md1);
    margin-left: var(--lg1);
    padding-left: var(--lg1);
    padding-top: var(--md1);
    padding-bottom: var(--sm4);
    border-top: 1px dashed var(--color-border-muted);
    display: flex;
    flex-direction: column;
    gap: var(--md1);
    position: relative;
    background: linear-gradient(
      to bottom,
      var(--color-bg-raised),
      transparent 40px
    );

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 2px;
      background: linear-gradient(
        to bottom,
        var(--color-primary-muted),
        transparent
      );
    }
  }

  .nesting-connector {
    position: absolute;
    left: -1.5rem;
    top: -0.5rem;
    width: 1rem;
    height: 1rem;

    &::before {
      content: '└';
      position: absolute;
      left: 0;
      top: 0;
      color: var(--color-primary-muted);
      font-size: var(--lg1);
      font-weight: 300;
      line-height: 1;
    }
  }
</style>
