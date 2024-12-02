<script lang="ts">
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { RichText } from '@mathesar/components/rich-text';
  import TableName from '@mathesar/components/TableName.svelte';
  import { Meta, TabularData } from '@mathesar/stores/table-data';
  import { currentTablesMap } from '@mathesar/stores/tables';
  import Pagination from '@mathesar/utils/Pagination';
  import { Window, defined, portal } from '@mathesar-component-library';

  import RecordSelectorContent from './RecordSelectorContent.svelte';
  import { RecordSelectorController } from './RecordSelectorController';

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
  let controllerCanCancel = false;

  $: nestedController = new RecordSelectorController({
    nestingLevel: controller.nestingLevel + 1,
  });
  $: ({ tableId, purpose } = controller);
  $: table = defined($tableId, (id) => $currentTablesMap.get(id));
  $: tabularData =
    $tableId && table
      ? new TabularData({
          database: table.schema.database,
          meta: new Meta({ pagination: new Pagination({ size: 10 }) }),
          hasEnhancedPrimaryKeyCell: false,
          table,
          loadIntrinsicRecordSummaries: true,
        })
      : undefined;
  $: nestedSelectorIsOpen = nestedController.isOpen;
  $: marginBottom = $nestedSelectorIsOpen
    ? `calc(${nestedSelectorVerticalOffset} - ${contentHeight}px)`
    : '0';

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && !$nestedSelectorIsOpen) {
      controller.cancel();
    }
  }

  function isElementInsideParent(
    childElement: HTMLElement | null,
    parentElement: HTMLElement | null,
  ): boolean {
    let currentNode = childElement;

    while (currentNode !== null) {
      if (currentNode === parentElement) {
        return true; // Found the parent element
      }
      currentNode = currentNode.parentNode as HTMLElement | null;
    }

    return false; // Parent element not found in the hierarchy
  }

  // Prevents the RecordSelector Modal from closing for 500ms
  // after mounting to preserve double click behaviour
  onMount(() => {
    setTimeout(() => {
      controllerCanCancel = true;
    }, 500);
  });


  function onWindowClick(event: MouseEvent) {
    if ($nestedSelectorIsOpen) return;

    const currentModal = windowPositionerElement.lastChild as HTMLElement;
    const currentWindow = currentModal.firstChild?.firstChild as HTMLElement;
    const isElementInside = isElementInsideParent(
      event.target as HTMLElement | null,
      currentWindow,
    );

    if (!isElementInside && controllerCanCancel) controller.cancel();
  }


</script>

<svelte:window on:keydown={handleKeydown} on:click|capture={onWindowClick} />

{#if tabularData}
  <div class="record-selector-window" style="margin-bottom: {marginBottom};">
    <Window on:close={() => controller.cancel()} canScrollBody={false}>
      <span slot="title">
        <RichText
          text={$purpose === 'dataEntry'
            ? $_('pick_table_record')
            : $_('open_table_record')}
          let:slotName
        >
          {#if slotName === 'tableName' && table}
            <TableName table={{ name: table.name }} truncate={false} />
          {/if}
        </RichText>
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
