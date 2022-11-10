<script lang="ts">
  import { get } from 'svelte/store';

  import type { IconProps } from '@mathesar-component-library/types';
  import NameWithIcon from '@mathesar/components/NameWithIcon.svelte';
  import { iconConstraint, iconTableLink } from '@mathesar/icons';
  import {
    currentDbAbstractTypes,
    getAbstractTypeForDbType,
  } from '@mathesar/stores/abstract-types';
  import type { DisplayColumn } from './types';

  export let column: DisplayColumn;
  export let isLoading = false;

  function getColumnIconProps(_column: DisplayColumn): IconProps | IconProps[] {
    if (_column.constraintsType?.includes('primary')) {
      return iconConstraint;
    }

    if (_column.constraintsType?.includes('foreignkey')) {
      return iconTableLink;
    }

    return getAbstractTypeForDbType(
      _column.type,
      get(currentDbAbstractTypes)?.data,
    ).getIcon({
      dbType: _column.type,
      typeOptions: _column.type_options,
    });
  }

  $: icon = getColumnIconProps(column);
</script>

<NameWithIcon on:click {icon} {isLoading}>{column.name}</NameWithIcon>
