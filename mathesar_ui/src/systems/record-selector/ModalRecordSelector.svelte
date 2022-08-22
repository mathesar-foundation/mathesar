<script lang="ts">
  import type {
    ModalCloseAction,
    ModalController,
  } from '@mathesar-component-library';
  import { ControlledModal } from '@mathesar-component-library';
  import RecordSelectorContent from './RecordSelectorContent.svelte';
  import type { RecordSelectorController } from './RecordSelectorController';
  import RecordSelectorTitle from './RecordSelectorTitle.svelte';

  export let recordSelectorController: RecordSelectorController;
  export let modalController: ModalController;

  $: ({ columnWithNestedSelectorOpen } = recordSelectorController);
  $: nestedSelectorIsOpen = !!$columnWithNestedSelectorOpen;

  function getModalCloseActions(
    _nestedSelectorIsOpen: boolean,
  ): ModalCloseAction[] {
    if (_nestedSelectorIsOpen) {
      return ['button'];
    }
    return ['button', 'esc', 'overlay'];
  }
  $: closeOn = getModalCloseActions(nestedSelectorIsOpen);

  $: ({ tableId } = recordSelectorController);
</script>

<ControlledModal
  controller={modalController}
  {closeOn}
  size="flex"
  on:close={() => recordSelectorController.cancel()}
  verticalAlign="top"
>
  <svelte:fragment slot="title">
    {#if $tableId}
      <RecordSelectorTitle tableId={$tableId} />
    {/if}
  </svelte:fragment>
  <RecordSelectorContent controller={recordSelectorController} />
</ControlledModal>
