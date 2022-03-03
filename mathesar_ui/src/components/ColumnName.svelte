<script lang="ts">
  import type { Column } from '@mathesar/stores/table-data/types';
  import {
    currentDbAbstractTypes,
    getAbstractTypeForDbType,
  } from '@mathesar/stores/abstract-types';

  export let column: Column;

  $: abstractTypeOfColumn = getAbstractTypeForDbType(
    column.type,
    $currentDbAbstractTypes.data,
  );
</script>

<span class="column-name">
  <span class="type">{abstractTypeOfColumn.icon}</span>
  <span class="name">{column.name}</span>
</span>

<style>
  .column-name {
    display: flex;
  }

  .type {
    margin-right: 5px;
    color: #7f7f7f;
    font-weight: 500;
  }

  .name {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
