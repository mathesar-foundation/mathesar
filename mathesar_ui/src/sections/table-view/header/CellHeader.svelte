<script lang="ts">
  import {
    faChevronRight,
    faCog,
    faSortAmountDown,
    faSortAmountDownAlt,
    faThList,
  } from '@fortawesome/free-solid-svg-icons';
  import { Dropdown, Icon } from '@mathesar-components';
  import type {
    ColumnPosition,
    GroupOption,
    SortOption,
    TableColumn,
  } from '@mathesar/stores/tableData';
  import { patchColumnType } from '@mathesar/stores/tableData';
  import type { MathesarType } from '@mathesar/stores/databases';
  import { createEventDispatcher } from 'svelte';
  import { intersection, pair, notEmpty } from '@mathesar/utils/language';

  const dispatch = createEventDispatcher();
  export let mathesarTypes: MathesarType[];
  export let tableId: number;
  export let sort: SortOption;
  export let group: GroupOption;
  export let column: TableColumn;
  export let columnPosition: ColumnPosition;
  export let paddingLeft: number;

  $: columnId = column.index;

  let isAdvancedOptionsOpen = false;
  let isOpen = false;

  function closeAdvancedOptions() {
    isAdvancedOptionsOpen = false;
  }

  function sortByColumn(column: TableColumn, order: 'asc' | 'desc') {
    const newSort: SortOption = new Map(sort);
    if (sort?.get(column.name) === order) {
      newSort.delete(column.name);
    } else {
      newSort.set(column.name, order);
    }
    sort = newSort;
    dispatch('reload');
  }

  function groupByColumn(column: TableColumn) {
    const oldSize = group?.size || 0;
    const newGroup = new Set(group);
    if (newGroup?.has(column.name)) {
      newGroup.delete(column.name);
    } else {
      newGroup.add(column.name);
    }
    group = newGroup;
    /**
     * Only reset item positions when group layout is created or destroyed
     */
    dispatch('reload', {
      resetPositions: oldSize === 0 || group.size === 0,
    });
  }

  function determineDataIcon(type: string) {
    switch (type) {
      case 'INTEGER':
      case 'NUMERIC':
        return '#';
      case 'VARCHAR':
        return 'T';
      default:
        return 'i';
    }
  }

  // TODO use mathesarTypes instead of manual construction
  function determineDataTitle(type: string) {
    switch (type) {
      case 'INTEGER':
      case 'NUMERIC':
        return 'Number';
      case 'VARCHAR':
        return 'Text';
      default:
        return 'Else';
    }
  }

  type DbType = string;

  function mathesarTypeHasAtLeastOneValidDbTypeTarget(
    validDbTypeTargetsPerMathesarType: DbTypeTargetsPerMathesarType,
    mathesarType: MathesarType,
  ) {
    // eslint-disable-next-line operator-linebreak
    const validDbTypeTargets =
      validDbTypeTargetsPerMathesarType[mathesarType.identifier] as DbType[];
    const atLeastOne = notEmpty(validDbTypeTargets);
    return atLeastOne;
  }

  function choosePreferredDbType(
    mathesarType: MathesarType,
    validDbTypeTargets: DbType[],
  ): DbType {
    // TODO implement
    return '';
  }

  type DbTypeTargetsPerMathesarType = Map<MathesarType['identifier'], DbType[]>;

  function getValidDbTypeTargetsPerColumnAndMathesarType(
    column: TableColumn,
    mathesarTypes: MathesarType[],
  ): DbTypeTargetsPerMathesarType {
    function getValidDbTypeTargetsForColumnAndMathesarType(
      column: TableColumn,
      mathesarType: MathesarType,
    ): DbType[] {
      return intersection(
        new Set(column.validTargetTypes),
        new Set(mathesarType.db_types),
      );
    }
    const pairs = mathesarTypes.map(
      (mathesarType) => pair(
        mathesarType.identifier,
        getValidDbTypeTargetsForColumnAndMathesarType(column, mathesarType),
      ),
    );
    return new Map(pairs);
  }

  function patchColumnToMathesarType(
    tableId: number,
    columnId: number,
    validDbTypeTargetsPerMathesarType: DbTypeTargetsPerMathesarType,
    mathesarType: MathesarType,
  ): void {
    if (validDbTypeTargetsPerMathesarType) {
      isOpen = false;
      isAdvancedOptionsOpen = false;

      // eslint-disable-next-line operator-linebreak
      const validDbTypeTargets =
        validDbTypeTargetsPerMathesarType[mathesarType.identifier] as DbType[];
      const newDbType = choosePreferredDbType(mathesarType, validDbTypeTargets);

      void patchColumnType(tableId, columnId, newDbType);
    }
  }

  $: validDbTypeTargetsPerMathesarType = mathesarTypes
    ? getValidDbTypeTargetsPerColumnAndMathesarType(column, mathesarTypes)
    : undefined;

  $: validMathesarTypeTargets = mathesarTypes && validDbTypeTargetsPerMathesarType
    ? mathesarTypes.filter(
      (mt: MathesarType) =>
        // eslint-disable-next-line implicit-arrow-linebreak
        mathesarTypeHasAtLeastOneValidDbTypeTarget(validDbTypeTargetsPerMathesarType, mt),
    )
    : undefined;

  $: patchType = (mathesarType: MathesarType) =>
    // eslint-disable-next-line implicit-arrow-linebreak
    patchColumnToMathesarType(
      tableId,
      columnId,
      validDbTypeTargetsPerMathesarType,
      mathesarType,
    );

</script>

<div
  class="cell"
  style="
      width:{columnPosition.get(column.name).width}px;
      left:{columnPosition.get(column.name).left + paddingLeft}px;"
>
  <span class="type">
    {determineDataIcon(column.type)}
  </span>
  <span class="name">{column.name}</span>

  <Dropdown
    bind:isOpen
    triggerClass="opts"
    triggerAppearance="plain"
    contentClass="table-opts-content"
    functionBeforeClose={closeAdvancedOptions}
  >
    <svelte:fragment slot="content">
      <div>
        {#if isAdvancedOptionsOpen}
          <h6 class="category">Advanced Options</h6>
          <span class="title">Set '{column.name}' type</span>
          <ul class="type-list">
            {#each validMathesarTypeTargets as mathesarType}
              <li>
                <button
                  on:click={ () => patchType(mathesarType) }
                >
                  {mathesarType.name}
                </button>
              </li>
            {:else}
              <li>
              </li>
            {/each}
          </ul>
        {:else}
          <h6 class="category">Data Type</h6>
          <button
            class="list-button with-right-icon"
            on:click={() => { isAdvancedOptionsOpen = true; }}
          >
            <div>
              <span class="data-icon">{determineDataIcon(column.type)}</span>
              <span>
                {determineDataTitle(column.type)}
              </span>
            </div>
            <div>
              <Icon class="right-icon" data={faCog} />
              <Icon class="right-icon" data={faChevronRight} />
            </div>
          </button>
          <ul>
            <li>
              <button
                class="list-button"
                on:click={() => sortByColumn(column, 'asc')}
              >
                <Icon class="opt" data={faSortAmountDownAlt} />
                <span>
                  {#if sort?.get(column.name) === 'asc'}
                    Remove asc sort
                  {:else}
                    Sort Ascending
                  {/if}
                </span>
              </button>
            </li>
            <li>
              <button
                class="list-button"
                on:click={() => sortByColumn(column, 'desc')}
              >
                <Icon class="opt" data={faSortAmountDown} />
                <span>
                  {#if sort?.get(column.name) === 'desc'}
                    Remove desc sort
                  {:else}
                    Sort Descending
                  {/if}
                </span>
              </button>
            </li>
            <li>
              <button
                class="list-button"
                on:click={() => groupByColumn(column)}
              >
                <Icon class="opt" data={faThList} />
                <span>
                  {#if group?.has(column.name)}
                    Remove grouping
                  {:else}
                    Group by column
                  {/if}
                </span>
              </button>
            </li>
          </ul>
        {/if}
      </div>
    </svelte:fragment>
  </Dropdown>
</div>
