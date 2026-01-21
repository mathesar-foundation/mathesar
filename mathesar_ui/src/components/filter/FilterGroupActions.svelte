<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { get } from 'svelte/store';
  import { _ } from 'svelte-i18n';

  import type { ConstraintType } from '@mathesar/api/rpc/constraints';
  import ColumnName from '@mathesar/components/column/ColumnName.svelte';
  import { iconAddFilter, iconFilterGroup } from '@mathesar/icons';
  import type { ReadableMapLike } from '@mathesar/typeUtils';
  import {
    Button,
    ButtonMenuItem,
    DropdownMenu,
    Icon,
  } from '@mathesar-component-library';

  import {
    type FilterEntryColumn,
    FilterGroup,
    makeIndividualFilter,
  } from './utils';

  interface $$Events {
    update: void;
  }

  const dispatch = createEventDispatcher<$$Events>();

  export let level = 0;
  export let columns: ReadableMapLike<
    FilterEntryColumn['id'],
    FilterEntryColumn
  >;
  export let getColumnLabel: (column: FilterEntryColumn) => string;
  export let getColumnConstraintType: (
    column: FilterEntryColumn,
  ) => ConstraintType[] | undefined;

  export let filterGroup: FilterGroup;

  function addFilter(columnInfo: FilterEntryColumn) {
    const filter = makeIndividualFilter(
      columns,
      getColumnConstraintType,
      columnInfo.id,
    );
    if (filter) {
      filterGroup.addArgument(filter);
      dispatch('update');
    }
  }

  function addFilterGroup() {
    filterGroup.addArgument(
      new FilterGroup({
        type: 'group',
        operator: get(filterGroup.operator) === 'and' ? 'or' : 'and',
        args: [],
      }),
    );
    dispatch('update');
  }
</script>

<div class="filter-group-actions">
  {#if level > 0 && $$slots.text}
    <div class="text">
      <slot name="text" />
    </div>
  {/if}
  <div class="actions">
    <DropdownMenu
      icon={{ ...iconAddFilter, size: '0.9rem' }}
      label={$_('add_filter')}
      triggerAppearance="secondary"
    >
      {#each [...columns.values()] as columnInfo (columnInfo.id)}
        <ButtonMenuItem on:click={() => addFilter(columnInfo)}>
          <ColumnName
            column={{
              name: getColumnLabel(columnInfo),
              type: columnInfo?.column.type ?? 'unknown',
              type_options: columnInfo?.column.type_options ?? null,
              constraintsType: getColumnConstraintType(columnInfo),
              metadata: columnInfo?.column.metadata ?? null,
            }}
          />
        </ButtonMenuItem>
      {/each}
    </DropdownMenu>

    {#if level < 2}
      <Button appearance="secondary" on:click={addFilterGroup}>
        <Icon {...iconFilterGroup} />
        {$_('add_filter_group')}
      </Button>
    {/if}

    <slot />
  </div>
</div>

<style lang="scss">
  .filter-group-actions {
    display: flex;
    margin-left: 1.4rem;

    .text {
      flex-grow: 1;
    }

    .actions {
      display: flex;
      gap: var(--sm5);
    }
  }
</style>
