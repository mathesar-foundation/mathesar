<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { iconAddGroup, iconAddNew } from '@mathesar/icons';
  import type { ReadableMapLike } from '@mathesar/typeUtils';
  import { Button, Icon } from '@mathesar-component-library';

  import {
    type FilterEntryColumn,
    FilterGroup,
    makeIndividualFilter,
  } from './utils';

  type T = $$Generic;
  type ColumnLikeType = FilterEntryColumn<T>;
  interface $$Events {
    update: void;
  }

  const dispatch = createEventDispatcher<$$Events>();

  export let level = 0;
  export let columns: ReadableMapLike<ColumnLikeType['id'], ColumnLikeType>;

  export let operator: FilterGroup<T>['operator'];
  export let args: FilterGroup<T>['args'];

  export let showTextInButtons = false;

  function addFilter() {
    const filter = makeIndividualFilter(columns);
    if (filter) {
      args = [...args, filter];
      dispatch('update');
    }
  }

  function addFilterGroup() {
    args = [
      ...args,
      new FilterGroup({
        operator: operator === 'and' ? 'or' : 'and',
        args: [],
      }),
    ];
    dispatch('update');
  }
</script>

<div class="filter-group-actions">
  {#if level > 0}
    <div class="text">
      <slot name="text" />
    </div>
  {/if}
  <div class="actions">
    <Button appearance="action" on:click={addFilter}>
      <Icon {...iconAddNew} />
      {#if showTextInButtons}
        {$_('add_filter')}
      {/if}
    </Button>

    {#if level < 2}
      <Button appearance="action" on:click={addFilterGroup}>
        <Icon {...iconAddGroup} />
        {#if showTextInButtons}
          {$_('add_filter_group')}
        {/if}
      </Button>
    {/if}

    <slot />
  </div>
</div>

<style lang="scss">
  .filter-group-actions {
    display: flex;

    .text {
      flex-grow: 1;
    }

    .actions {
      display: flex;
      gap: var(--sm5);
      margin-left: auto;
    }
  }
</style>
