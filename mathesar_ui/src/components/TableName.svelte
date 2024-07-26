<script lang="ts">
  import type { ComponentProps } from 'svelte';

  import type { Table } from '@mathesar/api/rpc/tables';
  import { iconTable } from '@mathesar/icons';
  import { tableRequiresImportConfirmation } from '@mathesar/utils/tables';

  import NameWithIcon from './NameWithIcon.svelte';

  interface $$Props extends Omit<ComponentProps<NameWithIcon>, 'icon'> {
    table: Pick<Table, 'name'> &
      Parameters<typeof tableRequiresImportConfirmation>[0];
    isLoading?: boolean;
  }

  export let table: $$Props['table'];
  export let isLoading = false;

  $: isNotConfirmed = tableRequiresImportConfirmation(table);
</script>

<NameWithIcon icon={iconTable} {isLoading} {...$$restProps}>
  <slot tableName={table.name}>
    {table.name}
  </slot>
  {#if isNotConfirmed}*{/if}
</NameWithIcon>
