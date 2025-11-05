<script lang="ts">
  import CellBackground from '@mathesar/components/CellBackground.svelte';
  import { iconTable } from '@mathesar/icons';
  import type { VirtualColumn } from '@mathesar/stores/table-data';
  import { Icon, Tooltip } from '@mathesar-component-library';

  export let virtualColumn: VirtualColumn;
  export let isSelected = false;

  $: ({ sourceTableName, sourceColumnName, aggregation, multipleResults } =
    virtualColumn);
</script>

<div class="virtual-header-cell-root">
  <CellBackground when={isSelected} color="var(--cell-bg-color-row-selected)" />
  <div class="virtual-header-cell-btn" on:click on:mousedown on:mouseenter>
    <div class="virtual-column-content">
      <div class="virtual-column-icon">
        <Icon {...iconTable} size="0.9em" />
      </div>
      <div class="virtual-column-name">
        <span class="source-table">{sourceTableName}</span>
        <span class="arrow">→</span>
        <span class="source-column">{sourceColumnName}</span>
      </div>
      {#if multipleResults && aggregation}
        <Tooltip>
          <div slot="trigger" class="aggregation-badge">
            {aggregation}
          </div>
          <div slot="content">
            Aggregation: {aggregation}
          </div>
        </Tooltip>
      {/if}
    </div>
  </div>
</div>

<style lang="scss">
  .virtual-header-cell-root {
    width: 100%;
    height: 100%;
    cursor: inherit;
    position: relative;
  }

  .virtual-header-cell-btn {
    width: 100%;
    height: 100%;
    padding: var(--sm4);
    background: linear-gradient(
      135deg,
      color-mix(in srgb, var(--color-table) 15%, white),
      color-mix(in srgb, var(--color-table) 20%, white)
    );
    border-bottom: 2px solid color-mix(in srgb, var(--color-table) 40%, white);
    display: flex;
    align-items: center;
    font-size: inherit;
  }

  .virtual-column-content {
    display: flex;
    align-items: center;
    gap: var(--sm4);
    width: 100%;
    min-width: 0; // Allow text truncation
  }

  .virtual-column-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    color: var(--color-table);
  }

  .virtual-column-name {
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--sm5);
    min-width: 0; // Allow children to truncate
    font-weight: 500;

    .source-table {
      color: var(--color-table);
      font-size: var(--sm1);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
    }

    .arrow {
      flex-shrink: 0;
      color: var(--color-fg-muted);
      font-size: var(--sm2);
    }

    .source-column {
      color: var(--color-fg-base);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
    }
  }

  .aggregation-badge {
    flex-shrink: 0;
    font-size: var(--sm2);
    padding: 0.15rem 0.5rem;
    border-radius: var(--border-radius-s);
    background-color: var(--color-primary-bg);
    color: var(--color-primary);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    cursor: help;
  }
</style>
