<script lang="ts">
  import { Spinner } from '@mathesar-component-library';
  import type { IconProps } from '@mathesar-component-library/types';
  import { iconConstraint, iconTableLink } from '@mathesar/icons';
  import {
    getAbstractTypeForDbType,
    currentDbAbstractTypes,
  } from '@mathesar/stores/abstract-types';
  import { get } from 'svelte/store';
  import TypeIcon from '../TypeIcon.svelte';
  import type { DisplayColumn } from './types';

  export let column: DisplayColumn;
  export let isLoading = false;

  function getColumnIconProps(_column: DisplayColumn): IconProps {
    if (_column.constraintsType?.includes('primary')) {
      return iconConstraint;
    }

    if (_column.constraintsType?.includes('foreignkey')) {
      return iconTableLink;
    }

    return getAbstractTypeForDbType(
      _column.type,
      get(currentDbAbstractTypes)?.data,
    ).icon;
  }

  $: icon = getColumnIconProps(column);
</script>

<span class="column-name">
  <span class="icon">
    {#if isLoading}
      <Spinner />
    {:else}
      <TypeIcon {icon} />
    {/if}
  </span>
  <span class="name">
    {column.name}
  </span>
</span>

<style>
  .column-name {
    display: flex;
    align-items: center;
  }

  .icon {
    display: inline-flex;
    margin-right: 5px;
  }

  .name {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
