<script lang="ts">
  import { Window } from '@mathesar/component-library';
  import Identifier from '@mathesar/components/Identifier.svelte';
  import { currentDbAbstractTypes } from '@mathesar/stores/abstract-types';
  import { Meta } from '@mathesar/stores/table-data';
  import { TabularData } from '@mathesar/stores/table-data/tabularData';
  import { getTableName } from '@mathesar/stores/tables';
  import Pagination from '@mathesar/utils/Pagination';
  import type { RecordSelectorController } from './RecordSelectorController';
  import RecordSelectorTable from './RecordSelectorTable.svelte';

  export let controller: RecordSelectorController;
  export let windowPositionerElement: HTMLElement;

  $: ({ tableId } = controller);
  $: tabularData = $tableId
    ? new TabularData({
        id: $tableId,
        abstractTypesMap: $currentDbAbstractTypes.data,
        meta: new Meta({ pagination: new Pagination({ size: 10 }) }),
      })
    : undefined;
</script>

{#if tabularData}
  <Window on:close={() => controller.cancel()} canScrollBody={false}>
    <span slot="title">
      Locate or Create One
      {#if $tableId}
        <Identifier>{getTableName($tableId)}</Identifier>
      {/if}
      Record
    </span>
    <RecordSelectorTable {windowPositionerElement} {tabularData} {controller} />
  </Window>
{/if}
