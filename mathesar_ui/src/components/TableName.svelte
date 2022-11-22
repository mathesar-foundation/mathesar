<script lang="ts">
  import type { TableEntry } from '@mathesar/api/tables';
  import { isTableImportConfirmationRequired } from '@mathesar/utils/tables';
  import { iconTable } from '@mathesar/icons';
  import NameWithIcon from './NameWithIcon.svelte';

  export let table: {
    name: TableEntry['name'];
    data_files?: TableEntry['data_files'];
    import_verified?: TableEntry['import_verified'];
  };
  export let isLoading = false;

  $: isNotConfirmed = isTableImportConfirmationRequired(table);
</script>

<NameWithIcon icon={iconTable} {isLoading}>
  <span title={table.name}>
    {table.name}
    {#if isNotConfirmed}*{/if}
  </span>
</NameWithIcon>
