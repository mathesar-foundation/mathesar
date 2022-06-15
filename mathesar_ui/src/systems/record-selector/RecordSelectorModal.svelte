<script lang="ts">
  import { ControlledModal } from '@mathesar-component-library';
  import Identifier from '@mathesar/components/Identifier.svelte';
  import { tables } from '@mathesar/stores/tables';
  import type { RecordSelectorController } from './RecordSelectorController';

  export let controller: RecordSelectorController;

  $: tableIdStore = controller.tableId;
  $: tableId = $tableIdStore;
  $: table = tableId !== undefined ? $tables.data.get(tableId) : undefined;
</script>

<ControlledModal
  controller={controller.modal}
  closeOn={['button', 'esc', 'overlay']}
  size="flex"
  on:close={() => controller.cancel()}
>
  <span slot="title">
    Locate or Create one <Identifier>{table?.name}</Identifier> Record
  </span>
  <button on:click={() => controller.submit(1206)}>1206</button>
  <button on:click={() => controller.submit(621)}>621</button>
</ControlledModal>
