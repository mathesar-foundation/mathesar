<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import type { Writable } from 'svelte/store';
  import { _ } from 'svelte-i18n';

  import { iconGrouping } from '@mathesar/icons';
  import type { Grouping, ProcessedColumn } from '@mathesar/stores/table-data';
  import type { Dropdown } from '@mathesar-component-library';

  import OperationDropdown from '../OperationDropdown.svelte';

  import Group from './Group.svelte';

  interface $$Props extends ComponentProps<Dropdown> {
    grouping: Writable<Grouping>;
  }

  export let grouping: Writable<Grouping>;

  async function addColumnToOperation(column: ProcessedColumn) {
    grouping.update((g) =>
      g.withEntry({
        columnId: column.id,
        preprocFnId: undefined,
      }),
    );
  }
</script>

<OperationDropdown
  label={$_('group')}
  icon={iconGrouping}
  badgeCount={$grouping.entries.length}
  {addColumnToOperation}
  applied={$grouping.entries.length > 0}
  {...$$restProps}
>
  <Group {grouping} />
</OperationDropdown>
