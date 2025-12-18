<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import type { Writable } from 'svelte/store';
  import { _ } from 'svelte-i18n';

  import { iconHideColumn } from '@mathesar/icons';
  import type {
    HiddenColumns,
    ProcessedColumn,
  } from '@mathesar/stores/table-data';
  import type { Dropdown } from '@mathesar-component-library';

  import OperationDropdown from '../OperationDropdown.svelte';

  import HideColumns from './HideColumns.svelte';

  interface $$Props extends ComponentProps<Dropdown> {
    hiddenColumns: Writable<HiddenColumns>;
  }

  export let hiddenColumns: Writable<HiddenColumns>;

  async function addColumnToOperation(column: ProcessedColumn) {
    hiddenColumns.update((h) => h.withColumn(column.id));
  }
</script>

<OperationDropdown
  label={$_('hide_columns')}
  icon={iconHideColumn}
  badgeCount={$hiddenColumns.size}
  {addColumnToOperation}
  applied={true}
  {...$$restProps}
>
  <HideColumns {hiddenColumns} />
</OperationDropdown>
