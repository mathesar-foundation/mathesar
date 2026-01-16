<script lang="ts">
  import { takeLast } from 'iter-tools';
  import { onMount, tick } from 'svelte';
  import { get } from 'svelte/store';
  import { _ } from 'svelte-i18n';

  import type { LinkedRecordInputElement } from '@mathesar/components/cell-fabric/types';
  import {
    type DndChangeDetail,
    dnd,
  } from '@mathesar/components/drag-and-drop/dnd';
  import FilterGroupComponent from '@mathesar/components/filter/FilterGroup.svelte';
  import {
    FILTER_INPUT_CLASS,
    FilterGroup,
    type IndividualFilter,
    calcNumberOfIndividualFilters,
    makeIndividualFilter,
  } from '@mathesar/components/filter/utils';
  import { iconFiltering } from '@mathesar/icons';
  import { imperativeFilterControllerContext } from '@mathesar/pages/table/ImperativeFilterController';
  import {
    Filtering,
    type ProcessedColumn,
    getTabularDataStoreFromContext,
  } from '@mathesar/stores/table-data';
  import { getColumnConstraintTypeByColumnId } from '@mathesar/utils/columnUtils';

  import OperationDropdown from '../OperationDropdown.svelte';

  const tabularData = getTabularDataStoreFromContext();

  let isOpen = false;
  let content: HTMLElement | undefined;

  $: ({ meta, processedColumns, recordsData } = $tabularData);
  $: ({ filtering } = meta);
  $: filteringSqlExpr = JSON.stringify($filtering.sqlExpr);

  const imperativeFilterController = imperativeFilterControllerContext.get();

  let filterGroup = new FilterGroup();
  function onExternalFilteringChange(_extFiltering: Filtering) {
    if (!filterGroup.equalsRaw(_extFiltering.root)) {
      filterGroup = new FilterGroup(_extFiltering.root);
    }
  }
  $: onExternalFilteringChange($filtering);
  $: individualFilterCount = calcNumberOfIndividualFilters($filtering.root);
  $: filterGroupArgs = filterGroup.args;
  $: displayFilterList = $filterGroupArgs.length > 0;

  function activateLastFilterInput() {
    const lastFilterInput = takeLast(
      content?.querySelectorAll<HTMLElement | LinkedRecordInputElement>(
        `.${FILTER_INPUT_CLASS}`,
      ),
    );
    if (lastFilterInput) {
      if ('launchRecordSelector' in lastFilterInput) {
        void lastFilterInput.launchRecordSelector();
      } else {
        lastFilterInput.focus();
      }
    }
  }

  function updateVarsAndExternalFiltering() {
    if (get(filterGroup.args).length === 0) {
      filterGroup.operator.set('and');
    }
    const rawFilterGroup = filterGroup.toRaw();
    individualFilterCount = calcNumberOfIndividualFilters(rawFilterGroup);
    const newFiltering = new Filtering(rawFilterGroup);
    if (JSON.stringify(newFiltering.sqlExpr) !== filteringSqlExpr) {
      filtering.set(newFiltering);
    }
  }

  function onChange(e: DndChangeDetail<IndividualFilter, FilterGroup>) {
    e.fromParent.removeArgument(e.item);
    e.toParent.addArgument(e.item, e.toIndex);
    updateVarsAndExternalFiltering();
  }

  function addFilter(columnId: string) {
    const filter = makeIndividualFilter(
      $processedColumns,
      (c) => getColumnConstraintTypeByColumnId(c.id, $processedColumns),
      columnId,
    );
    if (filter) {
      filterGroup.addArgument(filter);
      updateVarsAndExternalFiltering();
    }
  }

  async function addColumnToOperation(column: ProcessedColumn) {
    addFilter(column.id);
    await tick();
    activateLastFilterInput();
  }

  onMount(() =>
    imperativeFilterController?.onOpenDropdown(() => {
      isOpen = true;
    }),
  );
  onMount(() => imperativeFilterController?.onAddFilter(addFilter));
  onMount(() =>
    imperativeFilterController?.onActivateLastFilterInput(
      activateLastFilterInput,
    ),
  );
</script>

<OperationDropdown
  bind:isOpen
  label={$_('filter')}
  icon={{ ...iconFiltering, size: '0.8em' }}
  badgeCount={individualFilterCount}
  {addColumnToOperation}
  applied={displayFilterList}
  {...$$restProps}
>
  <div class="filters" bind:this={content} use:dnd={{ onChange }}>
    <div class="header">{$_('filter_records')}</div>
    <div class="content">
      <FilterGroupComponent
        columns={$processedColumns}
        getColumnLabel={(c) => $processedColumns.get(c.id)?.column.name ?? ''}
        getColumnConstraintType={(c) =>
          getColumnConstraintTypeByColumnId(c.id, $processedColumns)}
        recordSummaries={recordsData.linkedRecordSummaries}
        {filterGroup}
        on:update={updateVarsAndExternalFiltering}
      />
    </div>
  </div>
</OperationDropdown>

<style lang="scss">
  .filters {
    padding: 1rem;
    min-width: min(41rem, calc(100svw - 1rem));
  }
  .header {
    font-weight: bolder;
  }
  .content {
    margin-top: 0.8rem;
  }
</style>
