<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import type { Writable } from 'svelte/store';
  import { _ } from 'svelte-i18n';

  import { iconSorting } from '@mathesar/icons';
  import type { ProcessedColumn, Sorting } from '@mathesar/stores/table-data';
  import type { Dropdown } from '@mathesar-component-library';

  import OperationDropdown from '../OperationDropdown.svelte';

  import Sort from './Sort.svelte';

  interface $$Props extends ComponentProps<Dropdown> {
    sorting: Writable<Sorting>;
  }

  export let sorting: Writable<Sorting>;

  async function addColumnToOperation(column: ProcessedColumn) {
    sorting.update((s) => s.with(column.id, 'ASCENDING'));
  }
</script>

<OperationDropdown
  label={$_('sort')}
  icon={iconSorting}
  badgeCount={$sorting.size}
  {addColumnToOperation}
  applied={$sorting.size > 0}
  {...$$restProps}
>
  <Sort {sorting} />
</OperationDropdown>
