<script lang="ts">
  import {
    faCog,
    faChevronRight,
    faChevronLeft,
  } from '@fortawesome/free-solid-svg-icons';
  import { Dropdown, Icon, Button } from '@mathesar-component-library';
  import type { ConstraintsDataStore } from '@mathesar/stores/table-data/types';
  import { currentDbAbstractTypes, getAbstractTypeForDBType } from '@mathesar/stores/abstract-types';
  import type {
    Meta,
    Column,
    ColumnPosition,
    ColumnsDataStore,
  } from '@mathesar/stores/table-data/types';

  import DefaultOptions from './DefaultOptions.svelte';
  import TypeOptions from './type-options/TypeOptions.svelte';

  export let columnPosition: ColumnPosition | undefined = undefined;
  export let column: Column;
  export let meta: Meta;
  export let columnsDataStore: ColumnsDataStore;
  export let constraintsDataStore: ConstraintsDataStore;

  $: abstractTypeOfColumn = getAbstractTypeForDBType(column.type, $currentDbAbstractTypes.data);

  let menuIsOpen = false;
  let view: 'default' | 'type' = 'default';

  function setDefaultView() {
    view = 'default';
  }

  function setTypeView() {
    view = 'type';
  }

  function closeMenu() {
    menuIsOpen = false;
    setDefaultView();
  }
</script>

<div
  class="cell"
  style="
    width:{columnPosition?.width || 0}px;
    left:{columnPosition?.left || 0}px;
  "
>
  <Dropdown
    bind:isOpen={menuIsOpen}
    triggerClass="column-opts"
    triggerAppearance="plain"
    contentClass="column-opts-content"
    on:close={setDefaultView}
  >
    <svelte:fragment slot="trigger">
      <span class="type">
        {abstractTypeOfColumn?.icon}
      </span>
      <span class="name">{column.name}</span>
    </svelte:fragment>
    <svelte:fragment slot="content">
      <div class="container">
        <div class="section type-header">
          {#if view === 'default'}
            <h6 class="category">Data Type</h6>
            <Button
              class="type-switch"
              appearance="plain"
              on:click={setTypeView}
            >
              <span>{abstractTypeOfColumn?.name}</span>
              <Icon size="0.8em" data={faCog} />
              <Icon size="0.7em" data={faChevronRight} />
            </Button>
          {:else if view === 'type'}
            <h6 class="category">
              <Button
                size="small"
                appearance="plain"
                class="padding-zero"
                on:click={setDefaultView}
              >
                <Icon data={faChevronLeft} />
                Go back
              </Button>
            </h6>
          {/if}
        </div>

        <div class="divider" />

        <div class="section">
          {#if view === 'default'}
            <h6 class="category">Operations</h6>
            <DefaultOptions
              {meta}
              {column}
              {columnsDataStore}
              {constraintsDataStore}
              on:close={closeMenu}
            />
          {:else if view === 'type'}
            <TypeOptions {column} {abstractTypeOfColumn} on:close={closeMenu} />
          {/if}
        </div>
      </div></svelte:fragment
    >
  </Dropdown>
</div>

<style global lang="scss">
  @import 'HeaderCell.scss';
</style>
