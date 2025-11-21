<script lang="ts">
  import { AttachableDropdown } from '@mathesar-component-library';

  import type { AttachableMultiTaggerController } from './AttachableMultiTaggerController';
  import MultiTagger from './MultiTagger.svelte';

  export let controller: AttachableMultiTaggerController;

  $: ({ triggerElement, multiTagger } = controller);
</script>

{#if $multiTagger}
  <AttachableDropdown
    trigger={$triggerElement}
    isOpen
    autoReposition
    trapFocus
    class="attachable-multi-tagger"
    on:close={() => controller.close()}
  >
    <MultiTagger controller={$multiTagger} close={() => controller.close()} />
  </AttachableDropdown>
{/if}

<style>
  :global(.attachable-multi-tagger) {
    display: grid;
    --Dropdown-content__overflow: hidden;
  }
</style>
