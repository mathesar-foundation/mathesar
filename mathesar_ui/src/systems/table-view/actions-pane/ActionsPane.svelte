<script lang="ts">
  import { Badge, Button, Dropdown, Icon } from '@mathesar-component-library';
  import type { TableEntry } from '@mathesar/api/types/tables';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import SaveStatusIndicator from '@mathesar/components/SaveStatusIndicator.svelte';
  import {
    iconFiltering,
    iconGrouping,
    iconSorting,
    iconInspector,
  } from '@mathesar/icons';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import { constructDataExplorerUrlToSummarizeFromGroup } from '@mathesar/systems/data-explorer';
  import TableNameAndDescription from '@mathesar/components/TableNameAndDescription.svelte';
  import Filter from './record-operations/filter/Filter.svelte';
  import Sort from './record-operations/sort/Sort.svelte';
  import Group from './record-operations/Group.svelte';
  import SummarizationLink from './SummarizationLink.svelte';

  export let database: Database;
  export let schema: SchemaEntry;
  export let table: Pick<TableEntry, 'name' | 'description'>;

  const tabularData = getTabularDataStoreFromContext();

  $: ({ id, columnsDataStore, recordsData, meta, isLoading, display } =
    $tabularData);
  $: ({ columns } = columnsDataStore);
  $: ({ filtering, sorting, grouping, sheetState } = meta);
  $: ({ isTableInspectorVisible } = display);

  $: summarizationUrl = constructDataExplorerUrlToSummarizeFromGroup(
    database.name,
    schema.id,
    {
      baseTableId: id,
      columns: $columns,
      terseGrouping: $grouping.terse(),
    },
  );

  function toggleTableInspector() {
    isTableInspectorVisible.set(!$isTableInspectorVisible);
  }
</script>

<div class="actions-pane">
  <div class="heading">
    <TableNameAndDescription {table} />
  </div>

  <div class="actions">
    <div class="quick-access">
      <Dropdown
        showArrow={false}
        triggerAppearance="secondary"
        contentClass="filter-dropdown-content"
      >
        <svelte:fragment slot="trigger">
          <Icon {...iconFiltering} size="0.8em" />
          <span>
            Filters
            {#if $filtering.entries.length > 0}
              <Badge>
                {$filtering.entries.length}
              </Badge>
            {/if}
          </span>
        </svelte:fragment>
        <svelte:fragment slot="content">
          <Filter filtering={meta.filtering} />
        </svelte:fragment>
      </Dropdown>

      <Dropdown showArrow={false} triggerAppearance="secondary">
        <svelte:fragment slot="trigger">
          <Icon {...iconSorting} />
          <span>
            Sort
            {#if $sorting.size > 0}
              <Badge>
                {$sorting.size}
              </Badge>
            {/if}
          </span>
        </svelte:fragment>
        <svelte:fragment slot="content">
          <Sort columns={$columns} sorting={meta.sorting} />
        </svelte:fragment>
      </Dropdown>

      <Dropdown showArrow={false} triggerAppearance="secondary">
        <svelte:fragment slot="trigger">
          <Icon {...iconGrouping} />
          <span>
            Group
            {#if $grouping.entries.length > 0}
              <Badge>
                {$grouping.entries.length}
              </Badge>
            {/if}
          </span>
        </svelte:fragment>
        <svelte:fragment slot="content">
          <Group grouping={meta.grouping} />
        </svelte:fragment>
      </Dropdown>
    </div>

    {#if $sheetState}
      <SaveStatusIndicator status={$sheetState} />
    {/if}

    <div class="aux-actions">
      <!-- Restricting Data Explorer redirection to single column
      grouping for the time being -->
      {#if summarizationUrl && $grouping.entries.length === 1}
        <SummarizationLink {summarizationUrl} />
      {/if}
      <Button
        appearance="secondary"
        size="medium"
        disabled={$isLoading}
        on:click={toggleTableInspector}
        active={$isTableInspectorVisible}
      >
        <Icon {...iconInspector} />
        <span>Inspector</span>
      </Button>
    </div>
  </div>
</div>

<style lang="scss">
  .actions-pane {
    --badge-font-size: var(--text-size-small);
    border-bottom: 1px solid var(--slate-300);
    background-color: var(--color-white);
    position: relative;
    display: flex;
    align-items: center;
  }
  .heading {
    /**
    * restricting the max-width 
    * so that long descriptions does not take all the available space
    */
    max-width: 20%;
    padding: 1rem;
    font-size: var(--text-size-large);
  }
  .actions {
    flex: 1;
    border-left: 1px solid var(--slate-300);
    display: flex;
    padding: 1rem;
    padding: 1rem;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
  .quick-access {
    display: flex;
    flex-direction: row;

    > :global(* + *) {
      margin-left: 0.5rem;
    }
  }

  .aux-actions {
    display: flex;
    flex-direction: row;
    align-items: center;

    > :global(* + *) {
      margin-left: 1rem;
    }
  }
  .actions-pane :global(.filter-dropdown-content.dropdown.content) {
    overflow-x: hidden;
    max-height: 320px;
  }
</style>
