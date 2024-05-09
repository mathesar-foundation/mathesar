<script lang="ts">
  import type { ComponentProps } from 'svelte';

  import type { TableEntry } from '@mathesar/api/rest/types/tables';
  import { iconTable } from '@mathesar/icons';
  import { isTableImportConfirmationRequired } from '@mathesar/utils/tables';

  import NameWithIcon from './NameWithIcon.svelte';

  interface $$Props extends Omit<ComponentProps<NameWithIcon>, 'icon'> {
    table: {
      name: TableEntry['name'];
      data_files?: TableEntry['data_files'];
      import_verified?: TableEntry['import_verified'];
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
