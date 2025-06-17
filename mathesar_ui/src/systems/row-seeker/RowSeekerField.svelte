<script lang="ts">
  import type { Column } from '@mathesar/api/rpc/columns';
  import type { ResultValue } from '@mathesar/api/rpc/records';
  import CellValue from '@mathesar/components/CellValue.svelte';
  import { Truncate } from '@mathesar-component-library';

  import type RowSeekerController from './RowSeekerController';

  export let controller: RowSeekerController;
  export let columnDisplayInfo: {
    id: number;
    column: Column;
    value: ResultValue;
    summary?: string;
  };

  async function addToFilter(e: Event) {
    e.stopPropagation();
    await controller.addToFilter(
      columnDisplayInfo.id,
      String(columnDisplayInfo.value),
    );
  }
</script>

<div class="field">
  <div class="column-name">
    <Truncate>
      {columnDisplayInfo.column.name}
    </Truncate>
  </div>
  <div class="column-value">
    <Truncate>
      <span on:mousedown|stopPropagation on:click={addToFilter}>
        {#if columnDisplayInfo.summary}
          {columnDisplayInfo.summary}
        {:else}
          <CellValue value={columnDisplayInfo.value} />
        {/if}
      </span>
    </Truncate>
  </div>
</div>

<style lang="scss">
  .field {
    display: flex;
    flex-direction: column;
    gap: var(--sm6);
    overflow: hidden;
  }

  .column-name {
    font-size: var(--sm2);
    color: var(--text-color-muted);
  }

  .column-value {
    font-size: var(--sm1);

    span {
      cursor: pointer;

      &:hover {
        text-decoration: underline;
      }
    }
  }
</style>
