<script lang="ts">
  import { Dropdown } from '@mathesar-components';
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

  function resetView() {
    view = 'default';
  }

  function closeDropdown() {
    isOpen = false;
    resetView();
  }
</script>

<div class="cell" style="width:{columnPosition?.width || 0}px;
      left:{(columnPosition?.left || 0)}px;">
  <span class="type">
    Type
  </span>
  <span class="name">{column.name}</span>

  <Dropdown bind:isOpen
            triggerClass="opts" triggerAppearance="plain"
            contentClass="table-opts-content"
            on:close={resetView}>
    <svelte:fragment slot="content">
      {#if view === 'default'}
        <DefaultOptions {meta} {column}/>
      {:else if view === 'type'}
        <TypeOptions {column} on:close={closeDropdown}/>
      {/if}
    </svelte:fragment>
  </Dropdown>
</div>
