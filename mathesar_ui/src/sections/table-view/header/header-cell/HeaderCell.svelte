<script lang="ts">
  import {
    faCog,
    faChevronRight,
    faChevronLeft,
  } from '@fortawesome/free-solid-svg-icons';
  import { Dropdown, Icon, Button } from '@mathesar-components';
  import type {
    Meta,
    Column,
    ColumnPosition,
  } from '@mathesar/stores/table-data/types';
  import DefaultOptions from './DefaultOptions.svelte';
  import TypeOptions from './type-options/TypeOptions.svelte';

  export let columnPosition: ColumnPosition;
  export let column: Column;
  export let meta: Meta;

  let isOpen = false;
  let view: 'default' | 'type' = 'default';

  function setDefaultView() {
    view = 'default';
  }

  function setTypeView() {
    view = 'type';
  }

  function closeDropdown() {
    isOpen = false;
    setDefaultView();
  }
</script>

<div class="cell" style="width:{columnPosition?.width || 0}px;
      left:{(columnPosition?.left || 0)}px;">
  <Dropdown bind:isOpen
            triggerClass="column-opts" triggerAppearance="plain"
            contentClass="column-opts-content"
            on:close={setDefaultView}>
    <svelte:fragment slot="trigger">
      <span class="type">
        #
      </span>
      <span class="name">{column.name}</span>
    </svelte:fragment>
    <svelte:fragment slot="content">
      <div class="container">
        <div class="section type-header">
          {#if view === 'default'}
          <h6 class="category">Data Type</h6>
          <Button class="type-switch" appearance="plain" on:click={setTypeView}>
            <span>{column.type}</span>
            <Icon size="0.8em" data={faCog}/>
            <Icon size="0.7em" data={faChevronRight}/>
          </Button>
          {:else if view === 'type'}
          <h6 class="category">
            <Button size="small" appearance="plain" class="padding-zero" on:click={setDefaultView}>
              <Icon data={faChevronLeft}/>
              Go back
            </Button>
          </h6>
          {/if}
        </div>

        <div class="divider"/>

        <div class="section">
          {#if view === 'default'}
            <h6 class="category">Operations</h6>
            <DefaultOptions {meta} {column} on:close={closeDropdown}/>
          {:else if view === 'type'}
            <TypeOptions {column} on:close={closeDropdown}/>
          {/if}
        </div>
    </svelte:fragment>
  </Dropdown>
</div>

<style global lang="scss">
  @import "HeaderCell.scss";
</style>
