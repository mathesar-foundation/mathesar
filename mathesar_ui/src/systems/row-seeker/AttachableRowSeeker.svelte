<script lang="ts">
  import type { SummarizedRecordReference } from '@mathesar/api/rpc/_common/commonTypes';
  import { AttachableDropdown } from '@mathesar-component-library';

  import type { AttachableRowSeekerController } from './AttachableRowSeekerController';
  import RowSeeker from './RowSeeker.svelte';

  export let selectedRecord: SummarizedRecordReference | undefined = undefined;
  export let controller: AttachableRowSeekerController;

  $: ({ triggerElement, rowSeeker } = controller);
</script>

{#if $rowSeeker}
  <AttachableDropdown
    trigger={$triggerElement}
    isOpen
    autoReposition
    on:close={() => controller.close()}
  >
    <RowSeeker
      controller={$rowSeeker}
      {selectedRecord}
      close={() => controller.close()}
    />
  </AttachableDropdown>
{/if}
