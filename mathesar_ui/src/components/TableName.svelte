<script lang="ts">
  import type { ComponentProps } from 'svelte';

  import type { Table } from '@mathesar/api/rest/types/tables';
  import { iconTable } from '@mathesar/icons';
  import { isTableImportConfirmationRequired } from '@mathesar/utils/tables';

  import NameWithIcon from './NameWithIcon.svelte';

  interface $$Props extends Omit<ComponentProps<NameWithIcon>, 'icon'> {
    table: {
      name: Table['name'];
      data_files?: Table['data_files'];
      import_verified?: Table['import_verified'];
    };
    isLoading?: boolean;
  }

  export let table: $$Props['table'];
  export let isLoading = false;

  $: isNotConfirmed = isTableImportConfirmationRequired(table);
</script>

<NameWithIcon icon={iconTable} {isLoading} {...$$restProps}>
  <slot tableName={table.name}>
    {table.name}
  </slot>
  {#if isNotConfirmed}*{/if}
</NameWithIcon>
