<script lang="ts">
  import Identifier from '@mathesar/components/Identifier.svelte';
  import { getTableName } from '@mathesar/stores/tables';

  export let tableId: number;
</script>

<span class="record-selector-title">
  Locate or Create One <Identifier>{getTableName(tableId)}</Identifier> Record
</span>
