<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { getQueryStringFromParams } from '@mathesar/api/rest/utils/requestUtils';
  import EntityPageHeader from '@mathesar/components/EntityPageHeader.svelte';
  import InspectorButton from '@mathesar/components/InspectorButton.svelte';
  import ModificationStatus from '@mathesar/components/ModificationStatus.svelte';
  import {
    iconExport,
    iconRequiresAttention,
    iconTable,
  } from '@mathesar/icons';
  import { tableInspectorVisible } from '@mathesar/stores/localStorage';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import { AnchorButton, Icon, Tooltip } from '@mathesar-component-library';

  import FilterDropdown from './record-operations/filter/FilterDropdown.svelte';
  import GroupDropdown from './record-operations/group/GroupDropdown.svelte';
  import SortDropdown from './record-operations/sort/SortDropdown.svelte';

  const tabularData = getTabularDataStoreFromContext();

  $: ({ table, meta, isLoading, hasPrimaryKey } = $tabularData);
  $: ({ currentRolePrivileges } = table.currentAccess);
  $: ({ filtering, sorting, grouping, sheetState } = meta);

  $: isSelectable = $currentRolePrivileges.has('SELECT');
  $: exportLinkParams = getQueryStringFromParams({
    database_id: table.schema.database.id,
    table_oid: table.oid,
    ...$sorting.recordsRequestParamsIncludingGrouping($grouping),
    ...$filtering.recordsRequestParams(),
  });

  const canViewLinkedEntities = true;

  function toggleTableInspector() {
    tableInspectorVisible.update((v) => !v);
  }
</script>

<EntityPageHeader
  title={{
    name: table.name,
    description: table.description ?? undefined,
    icon: iconTable,
  }}
  --icon-fill-color="linear-gradient(135deg, var(--color-table), var(--color-table-80))"
  --icon-stroke-color="var(--text-inverted)"
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
      <Tooltip allowHover>
        <AnchorButton
          slot="trigger"
          href="/api/export/v0/tables/?{exportLinkParams}"
          data-tinro-ignore
          appearance="secondary"
          size="medium"
          aria-label={$_('export')}
          download="{table.name}.csv"
        >
          <Icon {...iconExport} />
          <span class="responsive-button-label">{$_('export')}</span>
        </AnchorButton>
        <span slot="content">
          {$_('export_csv_help', {
            values: { tableName: table.name },
          })}
        </span>
      </Tooltip>

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
    color: var(--semantic-warning-icon);
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
