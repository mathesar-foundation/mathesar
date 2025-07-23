<script lang="ts">
  import { AttachableDropdown } from '@mathesar-component-library';

  import type AttachableRowSeekerController from './AttachableRowSeekerController';
  import RowSeeker from './RowSeeker.svelte';
  import type { SummarizedRecordReference } from '@mathesar/api/rpc/forms';

  export let selectedRecord: SummarizedRecordReference | undefined = undefined;
  export let controller: AttachableRowSeekerController;

  $: ({ isOpen, node, rowSeeker } = controller);
</script>

<AttachableDropdown
  trigger={node}
  isOpen={$isOpen}
  autoReposition
  on:close={() => controller.close()}
>
  <RowSeeker
    controller={rowSeeker}
    {selectedRecord}
    close={() => controller.close()}
  />
</AttachableDropdown>
