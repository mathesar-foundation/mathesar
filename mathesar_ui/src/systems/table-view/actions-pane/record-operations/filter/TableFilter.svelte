<script lang="ts">
  import { takeLast } from 'iter-tools';
  import { onMount } from 'svelte';
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
    makeIndividualFilter,
  } from '@mathesar/components/filter/utils';
  import { iconFiltering } from '@mathesar/icons';
  import { imperativeFilterControllerContext } from '@mathesar/pages/table/ImperativeFilterController';
  import {
    Filtering,
    getTabularDataStoreFromContext,
  } from '@mathesar/stores/table-data';
  import { getColumnConstraintTypeByColumnId } from '@mathesar/utils/columnUtils';
  import { BadgeCount, Dropdown, Icon } from '@mathesar-component-library';

  const tabularData = getTabularDataStoreFromContext();

  let isOpen = false;
  let content: HTMLElement | undefined;

  $: ({ meta, processedColumns, recordsData } = $tabularData);
  $: ({ filtering } = meta);
  $: filteringSqlExpr = JSON.stringify($filtering.sqlExpr);

  const imperativeFilterController = imperativeFilterControllerContext.get();

  let filterGroup = new FilterGroup<number>();
  function onExternalFilteringChange(_extFiltering: Filtering) {
    if (!_extFiltering.root.equals(filterGroup)) {
      filterGroup = _extFiltering.root.clone();
    }
  }
  $: onExternalFilteringChange($filtering);

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

  function setFilteringIfSqlExprHasChanged() {
    const newFiltering = new Filtering(filterGroup.clone());
    if (JSON.stringify(newFiltering.sqlExpr) !== filteringSqlExpr) {
      filtering.set(newFiltering);
    }
  }

  function onChange(
    e: DndChangeDetail<IndividualFilter<number>, FilterGroup<number>>,
  ) {
    e.fromParent.removeArgument(e.item);
    e.toParent.addArgument(e.item, e.toIndex);
    filterGroup = filterGroup.clone();
    setFilteringIfSqlExprHasChanged();
  }

  function addFilter(columnId: number) {
    const filter = makeIndividualFilter($processedColumns, columnId);
    if (filter) {
      filterGroup.addArgument(filter, filterGroup.args.length);
      filterGroup = filterGroup.clone();
      setFilteringIfSqlExprHasChanged();
    }
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

<Dropdown
  bind:isOpen
  showArrow={false}
  triggerAppearance="secondary"
  {...$$restProps}
  ariaLabel={$_('filter')}
>
  <svelte:fragment slot="trigger">
    <Icon {...iconFiltering} size="0.8em" />
    <span class="responsive-button-label with-badge">
      {$_('filter')}
      <BadgeCount value={$filtering.appliedFilterCount} />
    </span>
  </svelte:fragment>
  <div bind:this={content} slot="content" use:dnd={{ onChange }}>
    <FilterGroupComponent
      {...$$restProps}
      columns={$processedColumns}
      getColumnLabel={(c) => $processedColumns.get(c.id)?.column.name ?? ''}
      getColumnConstraintType={(c) =>
        getColumnConstraintTypeByColumnId(c.id, $processedColumns)}
      recordSummaries={recordsData.linkedRecordSummaries}
      getFilterGroup={() => filterGroup}
      bind:operator={filterGroup.operator}
      bind:args={filterGroup.args}
      on:update={setFilteringIfSqlExprHasChanged}
    />
  </div>
</Dropdown>

<style lang="scss">
  .with-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--sm5);
  }
</style>
