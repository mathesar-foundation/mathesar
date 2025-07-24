<script lang="ts">
  import type { SummarizedRecordReference } from '@mathesar/api/rpc/_common/commonTypes';
  import { AttachableDropdown } from '@mathesar-component-library';

  import type { AttachableRowSeekerController } from './AttachableRowSeekerController';
  import RowSeeker from './RowSeeker.svelte';

  export let selectedRecord: SummarizedRecordReference | undefined = undefined;
  export let controller: AttachableRowSeekerController;

  $: ({ isOpen, triggerElement, rowSeeker } = controller);
</script>

<AttachableDropdown
  trigger={triggerElement}
  isOpen={$isOpen}
  autoReposition
  on:close={() => controller.close()}
>
  {#if rowSeeker}
    <RowSeeker
      controller={rowSeeker}
      {selectedRecord}
      close={() => controller.close()}
    />
  {/if}
</AttachableDropdown>
