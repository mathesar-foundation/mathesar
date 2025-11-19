<script lang="ts">
  import { AttachableDropdown } from '@mathesar-component-library';

  import type { AttachableMultiTaggerController } from './AttachableMultiTaggerController';
  import RowSeeker from './MultiTagger.svelte';

  export let controller: AttachableMultiTaggerController;

  $: ({ triggerElement, multiTagger } = controller);
</script>

{#if $multiTagger}
  <AttachableDropdown
    trigger={$triggerElement}
    isOpen
    autoReposition
    trapFocus
    on:close={() => controller.close()}
  >
    <RowSeeker controller={$multiTagger} close={() => controller.close()} />
  </AttachableDropdown>
{/if}
