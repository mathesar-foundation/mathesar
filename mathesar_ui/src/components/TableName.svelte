<script lang="ts">
  import type { TableEntry } from '@mathesar/api/tables';
  import { iconTable } from '@mathesar/icons';
  import NameWithIcon from './NameWithIcon.svelte';

  export let table: Pick<TableEntry, 'name'>;
  export let isLoading = false;
</script>

<NameWithIcon icon={iconTable} {isLoading}>
  <span title={table.name}>{table.name}</span>
</NameWithIcon>
