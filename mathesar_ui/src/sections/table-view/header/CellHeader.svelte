<script lang="ts">
  import {
    faChevronRight,
    faCog,
    faSortAmountDown,
    faSortAmountDownAlt,
    faThList,
  } from "@fortawesome/free-solid-svg-icons";
  import { Dropdown, Icon } from "@mathesar-components";
  import type {
    ColumnPosition,
    GroupOption,
    SortOption,
    TableColumn,
  } from "@mathesar/stores/tableData";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();
  export let sort: SortOption;
  export let group: GroupOption;
  export let column: TableColumn;
  export let types: string[];
  export let columnPosition: ColumnPosition;
  export let paddingLeft: number;

  let isAdvancedOptionsOpen = false;
  let isOpen = false;

  function closeAdvancedOptions() {
    isAdvancedOptionsOpen = false;
  }

  function sortByColumn(column: TableColumn, order: "asc" | "desc") {
    const newSort: SortOption = new Map(sort);
    if (sort?.get(column.name) === order) {
      newSort.delete(column.name);
    } else {
      newSort.set(column.name, order);
    }
    sort = newSort;
    dispatch("reload");
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
    dispatch("reload", {
      resetPositions: oldSize === 0 || group.size === 0,
    });
  }

  function determineDataIcon(type: string) {
    switch (type) {
      case "INTEGER":
        return "#";
      case "VARCHAR":
        return "T";
      default:
        return "i";
    }
  }

  function determineDataTitle(type: string) {
    switch (type) {
      case "INTEGER":
        return "Number";
      case "VARCHAR":
        return "Text";
      default:
        return "Else";
    }
  }
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
          <h5 class="title">Set '{column.name}' type</h5>
          <ul class="type-list">
            {#each types as type}
              <li>
                <button>
                  {type}
                </button>
              </li>
            {/each}
          </ul>
        {:else}
          <h6 class="category">Data Type</h6>
          <button
            class="list-button with-right-icon"
            on:click={() => (isAdvancedOptionsOpen = true)}
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
                on:click={() => sortByColumn(column, "asc")}
              >
                <Icon class="opt" data={faSortAmountDownAlt} />
                <span>
                  {#if sort?.get(column.name) === "asc"}
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
                on:click={() => sortByColumn(column, "desc")}
              >
                <Icon class="opt" data={faSortAmountDown} />
                <span>
                  {#if sort?.get(column.name) === "desc"}
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
