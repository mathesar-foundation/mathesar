<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { getQueryStringFromParams } from '@mathesar/api/rest/utils/requestUtils';
  import EntityPageHeader from '@mathesar/components/EntityPageHeader.svelte';
  import ModificationStatus from '@mathesar/components/ModificationStatus.svelte';
  import { iconExport, iconInspector, iconTable } from '@mathesar/icons';
  import { tableInspectorVisible } from '@mathesar/stores/localStorage';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import {
    AnchorButton,
    Button,
    Icon,
    Tooltip,
  } from '@mathesar-component-library';

  import FilterDropdown from './record-operations/filter/FilterDropdown.svelte';
  import GroupDropdown from './record-operations/group/GroupDropdown.svelte';
  import SortDropdown from './record-operations/sort/SortDropdown.svelte';

  type TableActionsContext = 'page' | 'shared-consumer-page';

  const tabularData = getTabularDataStoreFromContext();

  export let context: TableActionsContext = 'page';

  $: ({ table, meta, isLoading } = $tabularData);
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
>
  {#if isSelectable}
    <div class="quick-access">
      <FilterDropdown {filtering} {canViewLinkedEntities} />
      <SortDropdown {sorting} />
      <GroupDropdown {grouping} />
    </div>
  {/if}

  {#if context === 'page'}
    <ModificationStatus requestState={$sheetState} />
  {/if}

  <div class="aux-actions" slot="actions-right">
    {#if context === 'page' && isSelectable}
      <!-- TODO: Display Share option when we re-implement it with the new permissions structure -->
      <!-- <ShareTableDropdown id={table.oid} /> -->

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

      <Button
        appearance="secondary"
        size="medium"
        disabled={$isLoading}
        on:click={toggleTableInspector}
        active={$tableInspectorVisible}
        aria-label={$_('inspector')}
      >
        <Icon {...iconInspector} />
        <span class="responsive-button-label">{$_('inspector')}</span>
      </Button>
    {/if}
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
      margin-left: 0.5rem;
    }
  }
</style>
