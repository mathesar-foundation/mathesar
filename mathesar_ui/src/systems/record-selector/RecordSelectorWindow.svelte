<script lang="ts">
  import { portal, Window } from '@mathesar/component-library';
  import TableName from '@mathesar/components/TableName.svelte';
  import { currentDbAbstractTypes } from '@mathesar/stores/abstract-types';
  import { Meta, TabularData } from '@mathesar/stores/table-data';
  import { getTableName } from '@mathesar/stores/tables';
  import { getArticleForWord } from '@mathesar/utils/languageUtils';
  import Pagination from '@mathesar/utils/Pagination';
  import RecordSelectorContent from './RecordSelectorContent.svelte';
  import { RecordSelectorController } from './RecordSelectorController';
  import type { RecordSelectorPurpose } from './recordSelectorUtils';

  const verbMap = new Map<RecordSelectorPurpose, string>([
    ['dataEntry', 'Pick'],
    ['navigation', 'Open'],
  ]);
  /**
   * This is the distance between the top of the nested selector window and the
   * top of the content within the parent window. Within that space we have the
   * column headers, the search inputs, and the divider. That UI should have a
   * consistent height, so it should be okay to hardcode this value. But if we
   * add more UI within that area, we'll need to update this value.
   */
  const nestedSelectorVerticalOffset = '2rem';

  export let controller: RecordSelectorController;
  export let windowPositionerElement: HTMLElement;

  let contentHeight = 0;

  $: nestedController = new RecordSelectorController({
    nestingLevel: controller.nestingLevel + 1,
  });
  $: ({ tableId, purpose } = controller);
  $: tabularData = $tableId
    ? new TabularData({
        id: $tableId,
        abstractTypesMap: $currentDbAbstractTypes.data,
        meta: new Meta({ pagination: new Pagination({ size: 10 }) }),
        hasEnhancedPrimaryKeyCell: false,
      })
    : undefined;
  $: tableName = $tableId ? getTableName($tableId) : undefined;
  $: verb = verbMap.get($purpose) ?? '';
  $: nestedSelectorIsOpen = nestedController.isOpen;
  $: marginBottom = $nestedSelectorIsOpen
    ? `calc(${nestedSelectorVerticalOffset} - ${contentHeight}px)`
    : '0';

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && !$nestedSelectorIsOpen) {
      controller.cancel();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if tabularData}
  <div class="record-selector-window" style="margin-bottom: {marginBottom};">
    <Window on:close={() => controller.cancel()} canScrollBody={false}>
      <span slot="title">
        {verb}
        {#if tableName}
          {getArticleForWord(tableName)}
          <TableName table={{ name: tableName }} truncate={false} />
        {/if}
        Record
      </span>

      <RecordSelectorContent
        bind:height={contentHeight}
        {tabularData}
        {controller}
        {nestedController}
      />

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
    --z-index__record_selector__row-header: 1;
    --z-index__record_selector__thead: 2;
    --z-index__record_selector__thead-row-header: 3;
    --z-index__record_selector__shadow-inset: 4;
    --z-index__record_selector__overlay: 5;
    --z-index__record_selector__above-overlay: 6;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 1rem;
  }
  .overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.1);
    z-index: var(--z-index__record_selector__overlay);
  }
</style>
