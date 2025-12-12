<script lang="ts">
  import { _ } from 'svelte-i18n';

  import EntityPageHeader from '@mathesar/components/EntityPageHeader.svelte';
  import InspectorButton from '@mathesar/components/InspectorButton.svelte';
  import ModificationStatus from '@mathesar/components/ModificationStatus.svelte';
  import { iconRequiresAttention } from '@mathesar/icons';
  import { tableInspectorVisible } from '@mathesar/stores/localStorage';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import {
    getTableIcon,
    getTableIconFillColor,
    isTableView,
  } from '@mathesar/utils/tables';
  import { Icon, Tooltip } from '@mathesar-component-library';

  import TableFilter from './record-operations/filter/TableFilter.svelte';
  import GroupDropdown from './record-operations/group/GroupDropdown.svelte';
  import JoinDropdown from './record-operations/join/JoinDropdown.svelte';
  import SortDropdown from './record-operations/sort/SortDropdown.svelte';

  const tabularData = getTabularDataStoreFromContext();

  $: ({ table, meta, isLoading, hasPrimaryKey } = $tabularData);
  $: ({ currentRolePrivileges } = table.currentAccess);
  $: ({ sorting, grouping, sheetState } = meta);

  $: isSelectable = $currentRolePrivileges.has('SELECT');
  $: isView = isTableView(table);
  $: tableIcon = getTableIcon(table);
  $: iconFillColor = getTableIconFillColor(table);

  function toggleTableInspector() {
    tableInspectorVisible.update((v) => !v);
  }
</script>

<EntityPageHeader
  title={{
    name: table.name,
    description: table.description ?? undefined,
    icon: tableIcon,
  }}
  --icon-fill-color={iconFillColor}
  --icon-stroke-color="var(--color-fg-inverted)"
>
  {#if isSelectable}
    <div class="quick-access">
      <TableFilter />
      <SortDropdown {sorting} />
      <GroupDropdown {grouping} />
      {#if !isView}
        <JoinDropdown />
      {/if}
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
          {#if isView}
            {$_('no_support_editing_views')}
          {:else}
            {$_('no_row_op_support_table_without_pk')}
          {/if}
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
