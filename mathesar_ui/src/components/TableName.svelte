<script lang="ts">
  import type { ComponentProps } from 'svelte';

  import type { Table } from '@mathesar/models/Table';
  import {
    getTableIcon,
    getTableIconColor,
    tableRequiresImportConfirmation,
  } from '@mathesar/utils/tables';

  import NameWithIcon from './NameWithIcon.svelte';

  interface $$Props extends Omit<ComponentProps<NameWithIcon>, 'icon'> {
    table: {
      name: Table['name'];
      type?: Table['type'];
    } & Parameters<typeof tableRequiresImportConfirmation>[0];
    isLoading?: boolean;
  }

  export let table: $$Props['table'];
  export let isLoading = false;
  export let cssVariables: Record<string, string> | undefined = undefined;

  $: isNotConfirmed = tableRequiresImportConfirmation(table);
  $: tableWithType = { ...table, type: table.type ?? 'table' };
  $: tableIcon = getTableIcon(tableWithType);
  $: iconColor = getTableIconColor(tableWithType);
</script>

<NameWithIcon
  icon={tableIcon}
  {isLoading}
  {...$$restProps}
  cssVariables={{
    '--icon-color': iconColor,
    ...cssVariables,
  }}
  bold
>
  <slot tableName={table.name}>
    {table.name}
  </slot>
  {#if isNotConfirmed}*{/if}
</NameWithIcon>
