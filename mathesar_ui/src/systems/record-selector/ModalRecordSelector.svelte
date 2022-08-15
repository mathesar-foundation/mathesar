<script lang="ts">
  import { derived, readable } from 'svelte/store';

  import type {
    ModalCloseAction,
    ModalController,
  } from '@mathesar-component-library';
  import { collapse, ensureReadable } from '@mathesar-component-library';
  import { ControlledModal } from '@mathesar-component-library';
  import RecordSelectorContent from './RecordSelectorContent.svelte';
  import type { RecordSelectorController } from './RecordSelectorController';
  import RecordSelectorTitle from './RecordSelectorTitle.svelte';

  export let recordSelectorController: RecordSelectorController;
  export let modalController: ModalController;

  let nestedController: RecordSelectorController | undefined;

  $: nestedSelectorIsOpen = ensureReadable(
    nestedController ? nestedController.isOpen : false,
  );
  $: ({ tabularData } = recordSelectorController);
  $: inputsContainUserEntry = collapse(
    derived(tabularData, (t) =>
      t ? derived(t.meta.searchFuzzy, (s) => s.size > 0) : readable(false),
    ),
  );

  function getModalCloseActions(
    _nestedSelectorIsOpen: boolean,
    _inputsContainUserEntry: boolean,
  ): ModalCloseAction[] {
    if (_nestedSelectorIsOpen || _inputsContainUserEntry) {
      return ['button'];
    }
    return ['button', 'esc', 'overlay'];
  }
  $: closeOn = getModalCloseActions(
    $nestedSelectorIsOpen,
    $inputsContainUserEntry,
  );

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
  <RecordSelectorContent
    controller={recordSelectorController}
    bind:nestedController
  />
</ControlledModal>
