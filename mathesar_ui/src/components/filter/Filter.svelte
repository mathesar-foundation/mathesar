<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import type { ConstraintType } from '@mathesar/api/rpc/constraints';
  import { iconDeleteMinor } from '@mathesar/icons';
  import type AssociatedCellData from '@mathesar/stores/AssociatedCellData';
  import type { ReadableMapLike } from '@mathesar/typeUtils';
  import { Button, Icon } from '@mathesar-component-library';

  import FilterGroupComponent from './FilterGroup.svelte';
  import IndividualFilterComponent from './IndividualFilter.svelte';
  import type {
    FilterEntryColumn,
    FilterGroup,
    IndividualFilter,
  } from './utils';

  interface $$Events {
    update: void;
    remove: void;
  }

  const dispatch = createEventDispatcher<$$Events>();

  export let columns: ReadableMapLike<
    FilterEntryColumn['id'],
    FilterEntryColumn
  >;
  export let getColumnLabel: (column: FilterEntryColumn) => string;
  export let getColumnConstraintType: (
    column: FilterEntryColumn,
  ) => ConstraintType[] | undefined = () => undefined;
  export let recordSummaries: AssociatedCellData<string>;

  export let filter: FilterGroup | IndividualFilter;
  export let level = 0;
</script>

<div class="filter-row" class:group={filter.type === 'group'}>
  {#if filter.type === 'individual'}
    <IndividualFilterComponent
      {columns}
      {getColumnLabel}
      {getColumnConstraintType}
      {recordSummaries}
      individualFilter={filter}
      on:update
    >
      <div class="remove">
        <Button appearance="plain" on:click={() => dispatch('remove')}>
          <Icon {...iconDeleteMinor} />
        </Button>
      </div>
    </IndividualFilterComponent>
  {:else}
    <FilterGroupComponent
      {columns}
      {getColumnLabel}
      {getColumnConstraintType}
      {recordSummaries}
      {level}
      filterGroup={filter}
      on:update
    >
      <div class="remove">
        <Button appearance="plain" on:click={() => dispatch('remove')}>
          <Icon {...iconDeleteMinor} />
        </Button>
      </div>
    </FilterGroupComponent>
  {/if}
</div>

<style lang="scss">
  .filter-row {
    display: flex;
    gap: 0.5rem;

    &.group {
      background: var(--filter-group-row-background);
      border-radius: var(--border-radius-m);
    }
  }
  .remove {
    --button-color: var(--color-fg-subtle-2);
    --button-padding: var(--sm6);
  }
</style>
