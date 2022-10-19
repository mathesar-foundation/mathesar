<script lang="ts">
  import { Window } from '@mathesar/component-library';
  import Identifier from '@mathesar/components/Identifier.svelte';
  import { currentDbAbstractTypes } from '@mathesar/stores/abstract-types';
  import { TabularData, Meta } from '@mathesar/stores/table-data';
  import { getTableName } from '@mathesar/stores/tables';
  import Pagination from '@mathesar/utils/Pagination';
  import type { RecordSelectorController } from './RecordSelectorController';
  import RecordSelectorTable from './RecordSelectorTable.svelte';
  import type { RecordSelectorPurpose } from './recordSelectorTypes';

  export let controller: RecordSelectorController;
  export let windowPositionerElement: HTMLElement;

  const verbMap = new Map<RecordSelectorPurpose, string>([
    ['dataEntry', 'Pick'],
    ['navigation', 'Go to'],
  ]);

  $: ({ tableId, purpose } = controller);
  $: tabularData = $tableId
    ? new TabularData({
        id: $tableId,
        abstractTypesMap: $currentDbAbstractTypes.data,
        meta: new Meta({ pagination: new Pagination({ size: 10 }) }),
      })
    : undefined;
  $: verb = verbMap.get($purpose) ?? '';
</script>

{#if tabularData}
  <Window on:close={() => controller.cancel()} canScrollBody={false}>
    <span slot="title">
      {verb} a
      {#if $tableId}
        <Identifier>{getTableName($tableId)}</Identifier>
      {/if}
      Record
    </span>
    <RecordSelectorTable {windowPositionerElement} {tabularData} {controller} />
  </Window>
{/if}
