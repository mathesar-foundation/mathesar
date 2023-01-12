<script lang="ts">
  import { Button, Icon } from '@mathesar-component-library';
  import type { TableEntry } from '@mathesar/api/types/tables';
  import EntityPageHeader from '@mathesar/components/EntityPageHeader.svelte';
  import ModificationStatus from '@mathesar/components/ModificationStatus.svelte';
  import { iconInspector, iconTable } from '@mathesar/icons';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import FilterDropdown from './record-operations/filter/FilterDropdown.svelte';
  import GroupDropdown from './record-operations/group/GroupDropdown.svelte';
  import SortDropdown from './record-operations/sort/SortDropdown.svelte';

  const tabularData = getTabularDataStoreFromContext();

  export let table: Pick<TableEntry, 'name' | 'description'>;

  $: ({ meta, isLoading, display } = $tabularData);
  $: ({ filtering, sorting, grouping, sheetState } = meta);
  $: ({ isTableInspectorVisible } = display);

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
    <SortDropdown {sorting} />
    <GroupDropdown {grouping} />
  </div>

  <ModificationStatus requestState={$sheetState} />

  <div class="aux-actions" slot="actions-right">
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
