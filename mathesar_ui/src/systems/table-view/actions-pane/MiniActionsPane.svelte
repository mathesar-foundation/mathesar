<script lang="ts">
  import type { ComponentProps } from 'svelte';

  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import type { Dropdown } from '@mathesar-component-library';

  import TableFilter from './record-operations/filter/TableFilter.svelte';
  import GroupDropdown from './record-operations/group/GroupDropdown.svelte';
  import SortDropdown from './record-operations/sort/SortDropdown.svelte';

  const dropdownProps: Partial<ComponentProps<Dropdown>> = {
    placement: 'bottom-end',
    size: 'small',
  };

  const tabularData = getTabularDataStoreFromContext();

  $: ({ meta } = $tabularData);
  $: ({ sorting, grouping } = meta);
</script>

<div class="mini-actions-pane">
  <TableFilter {...dropdownProps} />
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
