<script lang="ts">
  import { portal, Window } from '@mathesar/component-library';
  import Identifier from '@mathesar/components/Identifier.svelte';
  import { currentDbAbstractTypes } from '@mathesar/stores/abstract-types';
  import { TabularData, Meta } from '@mathesar/stores/table-data';
  import { getTableName } from '@mathesar/stores/tables';
  import { getArticleForWord } from '@mathesar/utils/languageUtils';
  import Pagination from '@mathesar/utils/Pagination';
  import { RecordSelectorController } from './RecordSelectorController';
  import RecordSelectorTable from './RecordSelectorTable.svelte';
  import type { RecordSelectorPurpose } from './recordSelectorTypes';
  import {} from './RecordSelectorController';

  const verbMap = new Map<RecordSelectorPurpose, string>([
    ['dataEntry', 'Pick'],
    ['navigation', 'Go to'],
  ]);
  /**
   * This is the distance between the top of the nested selector window and the
   * top of the content within the parent window. Within that space we have the
   * column headers, the search inputs, and the divider. That UI should have a
   * consistent height, so it should be okay to hardcode this value. But if we
   * add more UI within that area, we'll need to update this value.
   */
  const nestedSelectorVerticalOffset = '4.2rem';

  export let controller: RecordSelectorController;
  export let windowPositionerElement: HTMLElement;

  let tableHeight = 0;

  $: nestedController = new RecordSelectorController({
    nestingLevel: controller.nestingLevel + 1,
  });
  $: ({ tableId, purpose } = controller);
  $: tabularData = $tableId
    ? new TabularData({
        id: $tableId,
        abstractTypesMap: $currentDbAbstractTypes.data,
        meta: new Meta({ pagination: new Pagination({ size: 10 }) }),
      })
    : undefined;
  $: tableName = $tableId ? getTableName($tableId) : undefined;
  $: verb = verbMap.get($purpose) ?? '';
  $: nestedSelectorIsOpen = nestedController.isOpen;
  $: marginBottom = $nestedSelectorIsOpen
    ? `calc(${nestedSelectorVerticalOffset} - ${tableHeight}px)`
    : '0';
</script>

{#if tabularData}
  <div class="record-selector-window" style="margin-bottom: {marginBottom};">
    <Window on:close={() => controller.cancel()} canScrollBody={false}>
      <span slot="title">
        {verb}
        {#if tableName}
          {getArticleForWord(tableName)}
          <Identifier>{tableName}</Identifier>
        {/if}
        Record
      </span>

      <div bind:clientHeight={tableHeight}>
        <RecordSelectorTable {tabularData} {controller} {nestedController} />
      </div>

      {#if $nestedSelectorIsOpen}
        <div class="overlay" />
        <div
          class="nested-record-selector"
          use:portal={windowPositionerElement}
        >
          <svelte:self
            {windowPositionerElement}
            controller={nestedController}
          />
        </div>
      {/if}
    </Window>
  </div>
{/if}

<style>
  .record-selector-window {
    --z-index-overlay: 1;
    --z-index-above-overlay: 2;
  }
  .overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.1);
    z-index: var(--z-index-overlay);
  }
</style>
