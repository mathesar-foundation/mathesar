<script lang="ts">
  import { AttachableDropdown } from '@mathesar-component-library';

  import type { AttachableRowSeekerController } from './AttachableRowSeekerController';
  import RowSeeker from './RowSeeker.svelte';

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
    <RowSeeker controller={$rowSeeker} close={() => controller.close()} />
  </AttachableDropdown>
{/if}
