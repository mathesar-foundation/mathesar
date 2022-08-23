<script lang="ts">
  import type { TableEntry } from '@mathesar/api/tables';
  import { iconTable } from '@mathesar/icons';
  import NameWithIcon from './NameWithIcon.svelte';

  export let table: TableEntry;
</script>

<NameWithIcon icon={iconTable}>{table.name}</NameWithIcon>
