<script lang="ts">
  import { _ } from 'svelte-i18n';

  import EntityPageHeader from '@mathesar/components/EntityPageHeader.svelte';
  import ModificationStatus from '@mathesar/components/ModificationStatus.svelte';
  import { iconInspector, iconTable } from '@mathesar/icons';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import { Button, Icon } from '@mathesar-component-library';

  import FilterDropdown from './record-operations/filter/FilterDropdown.svelte';
  import GroupDropdown from './record-operations/group/GroupDropdown.svelte';
  import SortDropdown from './record-operations/sort/SortDropdown.svelte';

  type TableActionsContext = 'page' | 'shared-consumer-page';

  const tabularData = getTabularDataStoreFromContext();

  export let context: TableActionsContext = 'page';

  $: ({ table, meta, isLoading, display } = $tabularData);
  $: ({ filtering, sorting, grouping, sheetState } = meta);
  $: ({ isTableInspectorVisible } = display);

  const canViewLinkedEntities = true;

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
      <!-- TODO: Display Share option when we re-implement it with the new permissions structure -->
      <!-- <ShareTableDropdown id={table.oid} /> -->

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
