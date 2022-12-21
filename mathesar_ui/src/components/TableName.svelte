<script lang="ts">
  import type { ComponentProps } from 'svelte';

  import type { TableEntry } from '@mathesar/api/types/tables';
  import { isTableImportConfirmationRequired } from '@mathesar/utils/tables';
  import { iconTable } from '@mathesar/icons';
  //import NameWithIcon from './NameWithIcon.svelte';

  interface $$Props {//extends Omit<ComponentProps<NameWithIcon>, 'icon'> {
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
  
{table.name}
{#if isNotConfirmed}*{/if}

<!--
<NameWithIcon icon={iconTable} {isLoading} {...$$restProps}>
  
</NameWithIcon>
-->