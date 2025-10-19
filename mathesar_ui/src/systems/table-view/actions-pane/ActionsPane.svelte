<script lang="ts">
  import { _ } from 'svelte-i18n';

  import EntityPageHeader from '@mathesar/components/EntityPageHeader.svelte';
  import InspectorButton from '@mathesar/components/InspectorButton.svelte';
  import ModificationStatus from '@mathesar/components/ModificationStatus.svelte';
  import { iconRequiresAttention, iconTable } from '@mathesar/icons';
  import { trackRecent } from '@mathesar/utils/recentTracker';
  import { tableInspectorVisible } from '@mathesar/stores/localStorage';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import { Icon, Tooltip } from '@mathesar-component-library';

  import FilterDropdown from './record-operations/filter/FilterDropdown.svelte';
  import GroupDropdown from './record-operations/group/GroupDropdown.svelte';
  import SortDropdown from './record-operations/sort/SortDropdown.svelte';

  const tabularData = getTabularDataStoreFromContext();

  $: ({ table, meta, isLoading, hasPrimaryKey } = $tabularData);
  $: ({ currentRolePrivileges } = table.currentAccess);
  $: ({ filtering, sorting, grouping, sheetState } = meta);

  $: isSelectable = $currentRolePrivileges.has('SELECT');

  const canViewLinkedEntities = true;

  function toggleTableInspector() {
    tableInspectorVisible.update((v) => !v);
  }
</script>

<div
  use:trackRecent={{
    entityType: 'table',
    entityId: table.oid,
    databaseId: table.schema.database.id,
    schemaOid: table.schema.oid,
    entityName: table.name,
    entityDescription: table.description ?? undefined,
  }}
  style:--icon-fill-color="linear-gradient(135deg, var(--color-table), var(--color-table-80))"
  style:--icon-stroke-color="var(--color-fg-inverted)"
>
  <EntityPageHeader
    title={{
      name: table.name,
      description: table.description ?? undefined,
      icon: iconTable,
    }}
  >
  {#if isSelectable}
    <div class="quick-access">
      <FilterDropdown {filtering} {canViewLinkedEntities} />
      <SortDropdown {sorting} />
      <GroupDropdown {grouping} />
    </div>
  {/if}

  <ModificationStatus requestState={$sheetState} />

  {#if !$isLoading && !$hasPrimaryKey}
    <div class="no-pk-warning">
      <Tooltip allowHover>
        <div slot="trigger">
          <Icon size="1.3em" {...iconRequiresAttention} />
        </div>
        <span slot="content">
          {$_('no_row_op_support_table_without_pk')}
        </span>
      </Tooltip>
    </div>
  {/if}

  <div class="aux-actions" slot="actions-right">
    {#if isSelectable}
      <InspectorButton
        disabled={$isLoading}
        active={$tableInspectorVisible}
        toggle={toggleTableInspector}
      />
    {/if}
  </div>
</EntityPageHeader>
</div>

<style lang="scss">
  .quick-access {
    --badge-font-size: var(--sm1);
    display: flex;
    flex-direction: row;

    > :global(* + *) {
      margin-left: 0.5rem;
    }
  }

  .no-pk-warning {
    display: flex;
    align-items: center;
    color: var(--color-fg-warning);
  }

  .aux-actions {
    display: flex;
    flex-direction: row;
    align-items: center;

    > :global(* + *) {
      margin-left: 0.5rem;
    }
  }
</style>
