<script lang="ts">
  import { AttachableDropdown } from '@mathesar-component-library';

  import type AttachableRowSeekerController from './AttachableRowSeekerController';
  import RowSeeker from './RowSeeker.svelte';
  import type { RowSeekerRecord } from './rowSeekerUtils';

  export let selectedRecord: RowSeekerRecord | undefined = undefined;
  export let controller: AttachableRowSeekerController;

  $: ({ isOpen, node, rowSeeker } = controller);
</script>

<AttachableDropdown
  trigger={node}
  isOpen={$isOpen}
  on:close={() => controller.close()}
>
  <RowSeeker
    controller={rowSeeker}
    {selectedRecord}
    close={() => controller.close()}
  />
</AttachableDropdown>
