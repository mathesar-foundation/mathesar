<script lang="ts">
  import type { ComponentProps } from 'svelte';

  import type { Dropdown } from '@mathesar/component-library';
  import { currentDatabase } from '@mathesar/stores/databases';
  import { currentSchema } from '@mathesar/stores/schemas';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';

  import FilterDropdown from './record-operations/filter/FilterDropdown.svelte';
  import GroupDropdown from './record-operations/group/GroupDropdown.svelte';
  import SortDropdown from './record-operations/sort/SortDropdown.svelte';

  const userProfile = getUserProfileStoreFromContext();

  $: canViewLinkedEntities = !!$userProfile?.hasPermission(
    { database: $currentDatabase, schema: $currentSchema },
    'canViewLinkedEntities',
  );

  const dropdownProps: Partial<ComponentProps<Dropdown>> = {
    placement: 'bottom-end',
    size: 'small',
  };

  const tabularData = getTabularDataStoreFromContext();

  $: ({ meta } = $tabularData);
  $: ({ filtering, sorting, grouping } = meta);
</script>

<div class="mini-actions-pane">
  <FilterDropdown {filtering} {canViewLinkedEntities} {...dropdownProps} />
  <SortDropdown {sorting} {...dropdownProps} />
  <GroupDropdown {grouping} {...dropdownProps} />
</div>

<style>
  .mini-actions-pane {
    display: grid;
    grid-auto-flow: column;
    gap: 0.5rem;
  }
</style>
