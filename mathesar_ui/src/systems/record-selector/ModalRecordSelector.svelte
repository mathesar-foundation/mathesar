<script lang="ts">
  import type { ModalController } from '@mathesar-component-library';
  import { ControlledModal } from '@mathesar-component-library';
  import RecordSelectorContent from './RecordSelectorContent.svelte';
  import type { RecordSelectorController } from './RecordSelectorController';
  import RecordSelectorTitle from './RecordSelectorTitle.svelte';

  export let recordSelectorController: RecordSelectorController;
  export let modalController: ModalController;

  $: ({ tableId } = recordSelectorController);
</script>

<ControlledModal
  controller={modalController}
  closeOn={['button', 'esc', 'overlay']}
  size="flex"
  on:close={() => recordSelectorController.cancel()}
>
  <svelte:fragment slot="title">
    {#if $tableId}
      <RecordSelectorTitle tableId={$tableId} />
    {/if}
  </svelte:fragment>
  <RecordSelectorContent controller={recordSelectorController} />
</ControlledModal>
