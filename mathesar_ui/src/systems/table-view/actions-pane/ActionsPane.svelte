<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { TableEntry } from '@mathesar/api/rest/types/tables';
  import EntityPageHeader from '@mathesar/components/EntityPageHeader.svelte';
  import ModificationStatus from '@mathesar/components/ModificationStatus.svelte';
  import { iconInspector, iconTable } from '@mathesar/icons';
  import { currentDatabase } from '@mathesar/stores/databases';
  import { currentSchema } from '@mathesar/stores/schemas';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import { Button, Icon } from '@mathesar-component-library';

  import FilterDropdown from './record-operations/filter/FilterDropdown.svelte';
  import GroupDropdown from './record-operations/group/GroupDropdown.svelte';
  import SortDropdown from './record-operations/sort/SortDropdown.svelte';
  import ShareTableDropdown from './ShareTableDropdown.svelte';

  type TableActionsContext = 'page' | 'shared-consumer-page';

  const tabularData = getTabularDataStoreFromContext();
  const userProfile = getUserProfileStoreFromContext();

  export let context: TableActionsContext = 'page';
  export let table: Pick<TableEntry, 'name' | 'description'>;

  $: ({ id, meta, isLoading, display } = $tabularData);
  $: ({ filtering, sorting, grouping, sheetState } = meta);
  $: ({ isTableInspectorVisible } = display);
  $: canEditMetadata = !!$userProfile?.hasPermission(
    { database: $currentDatabase, schema: $currentSchema },
    'canEditMetadata',
  );
  $: canViewLinkedEntities = !!$userProfile?.hasPermission(
    { database: $currentDatabase, schema: $currentSchema },
    'canViewLinkedEntities',
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
    <FilterDropdown {filtering} {canViewLinkedEntities} />
    <SortDropdown {sorting} />
    <GroupDropdown {grouping} />
  </div>

  {#if context === 'page'}
    <ModificationStatus requestState={$sheetState} />
  {/if}

  <div class="aux-actions" slot="actions-right">
    {#if context === 'page'}
      {#if canEditMetadata}
        <ShareTableDropdown {id} />
      {/if}

      <Button
        appearance="secondary"
        size="medium"
        disabled={$isLoading}
        on:click={toggleTableInspector}
        active={$isTableInspectorVisible}
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
      margin-left: 1rem;
    }
  }
</style>
