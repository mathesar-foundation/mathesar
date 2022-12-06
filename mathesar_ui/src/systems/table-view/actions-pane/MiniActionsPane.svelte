<script lang="ts">
  import {
    Button,
    Dropdown,
    Icon,
    iconError,
  } from '@mathesar-component-library';
  import {
    iconFiltering,
    iconGrouping,
    iconRefresh,
    iconSorting,
  } from '@mathesar/icons';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import { States } from '@mathesar/api/utils/requestUtils';
  import Filter from './record-operations/filter/Filter.svelte';
  import Group from './record-operations/Group.svelte';
  import Sort from './record-operations/sort/Sort.svelte';

  const tabularData = getTabularDataStoreFromContext();

  $: ({ columnsDataStore, recordsData, meta, constraintsDataStore, isLoading } =
    $tabularData);
  $: ({ columns } = columnsDataStore);
  $: columnsFetchStatus = columnsDataStore.fetchStatus;
  $: recordState = recordsData.state;

  $: isError =
    $columnsFetchStatus?.state === 'failure' ||
    $recordState === States.Error ||
    $constraintsDataStore.state === States.Error;

  function refresh() {
    void $tabularData.refresh();
  }
</script>

<div class="mini-actions-pane">
  <Dropdown showArrow={false} ariaLabel="Filtering">
    <Icon slot="trigger" {...iconFiltering} />
    <Filter slot="content" filtering={meta.filtering} />
  </Dropdown>

  <Dropdown showArrow={false} ariaLabel="Sorting">
    <Icon slot="trigger" {...iconSorting} />
    <Sort slot="content" columns={$columns} sorting={meta.sorting} />
  </Dropdown>

  <Dropdown showArrow={false} ariaLabel="Grouping">
    <Icon slot="trigger" {...iconGrouping} />
    <Group slot="content" grouping={meta.grouping} />
  </Dropdown>

  <Button
    size="medium"
    disabled={$isLoading}
    on:click={refresh}
    aria-label="Refresh"
    title="Refresh"
  >
    <Icon
      {...isError && !isLoading ? iconError : iconRefresh}
      spin={$isLoading}
    />
  </Button>
</div>

<style>
  .mini-actions-pane {
    display: grid;
    grid-auto-flow: column;
    gap: 0.5rem;
  }
</style>
