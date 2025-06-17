<script lang="ts">
  import type { Column } from '@mathesar/api/rpc/columns';
  import type {
    RecordSummaryColumnData,
    SqlColumn,
    SqlLiteral,
  } from '@mathesar/api/rpc/records';
  import { Icon, iconClose } from '@mathesar-component-library';

  import type RowSeekerController from './RowSeekerController';

  export let controller: RowSeekerController;
  export let columnMap: Map<Column['id'], Column>;
  export let filter: [SqlColumn['value'], Set<SqlLiteral['value']>];
  export let linkedRecordSummaries: Record<
    string,
    RecordSummaryColumnData | undefined
  >;

  function getLinkedRecordSummary(columnId: number, literal: unknown) {
    const linkedSummary = linkedRecordSummaries[columnId];
    return linkedSummary?.[String(literal)] ?? undefined;
  }

  $: [columnId, literalsSet] = filter;
</script>

<div class="filter-tag">
  <div class="column">
    {columnMap.get(columnId)?.name ?? ''}
  </div>
  <div class="values">
    {#each [...literalsSet] as literal (literal)}
      <div class="val">
        {getLinkedRecordSummary(columnId, literal) ?? literal}
      </div>
    {/each}
  </div>
  <div
    class="close"
    on:click={() => controller.removeColumnFromFilter(columnId)}
  >
    <Icon {...iconClose} />
  </div>
</div>

<style lang="scss">
  .filter-tag {
    display: inline-flex;
    align-items: center;
    white-space: nowrap;
    border: 1px solid var(--salmon-300);
    margin-right: var(--sm5);
    margin-bottom: var(--sm5);

    .column {
      background-color: var(--salmon-100);
      padding: 0 var(--sm6);
      color: var(--slate-900);
    }
    .values {
      padding: 0 var(--sm6);
    }
    .close {
      font-size: var(--sm1);
      height: 100%;
      display: flex;
      align-items: center;
      cursor: pointer;
    }
  }
</style>
