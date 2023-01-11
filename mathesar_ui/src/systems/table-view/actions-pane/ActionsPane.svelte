<script lang="ts">
  import { Button, Icon } from '@mathesar-component-library';
  import type { TableEntry } from '@mathesar/api/types/tables';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import ModificationStatus from '@mathesar/components/ModificationStatus.svelte';
  import EntityPageHeader from '@mathesar/components/EntityPageHeader.svelte';
  import { iconInspector, iconTable } from '@mathesar/icons';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import { constructDataExplorerUrlToSummarizeFromGroup } from '@mathesar/systems/data-explorer';
  import FilterDropdown from './record-operations/filter/FilterDropdown.svelte';
  import GroupDropdown from './record-operations/group/GroupDropdown.svelte';
  import SortDropdown from './record-operations/sort/SortDropdown.svelte';
  import SummarizationLink from './SummarizationLink.svelte';

  export let database: Database;
  export let schema: SchemaEntry;
  export let table: Pick<TableEntry, 'name' | 'description'>;

  const tabularData = getTabularDataStoreFromContext();

  $: ({ id, columnsDataStore, meta, isLoading, display } = $tabularData);
  $: ({ columns } = columnsDataStore);
  $: ({ filtering, sorting, grouping, sheetState } = meta);
  $: ({ isTableInspectorVisible } = display);
  $: summarizationUrl = constructDataExplorerUrlToSummarizeFromGroup(
    database.name,
    schema.id,
    {
      baseTable: {
        id,
        name: table.name,
      },
      columns: $columns,
      terseGrouping: $grouping.terse(),
    },
  );

  function toggleTableInspector() {
    isTableInspectorVisible.set(!$isTableInspectorVisible);
  }
</script>

<EntityPageHeader
  title={{
    name: table.name,
    description: table.description ?? undefined,
    icon: iconTable,
  }}
>
  <div class="quick-access">
    <FilterDropdown {filtering} />
    <SortDropdown {sorting} columns={$columns} />
    <GroupDropdown {grouping} />
  </div>

  <ModificationStatus requestState={$sheetState} />

  <div class="aux-actions" slot="actions-right">
    {#if summarizationUrl}
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
</EntityPageHeader>

<style lang="scss">
  .quick-access {
    --badge-font-size: var(--text-size-small);
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
</style>
