<script lang="ts">
  import type { TableEntry } from '@mathesar/api/tables';
  import {
    ControlledModal,
    CancelOrProceedButtonPair,
  } from '@mathesar-component-library';
  import type { ModalController } from '@mathesar-component-library';
  import type { ColumnExtractionTargetType } from './columnExtractionTypes';

  export let controller: ModalController;
  export let targetType: ColumnExtractionTargetType;

  let table: TableEntry | undefined = undefined;

  $: canProceed = true;
  $: proceedButtonLabel =
    targetType === 'existingTable' ? 'Move Columns' : 'Create Table';

  async function handleSave() {}
</script>

<ControlledModal {controller}>
  <span slot="title">
    {#if targetType === 'existingTable'}
      Move column to existing linked table
    {:else}
      New linked table from column
    {/if}
  </span>

  (Content here)

  <CancelOrProceedButtonPair
    slot="footer"
    onProceed={handleSave}
    onCancel={() => controller.close()}
    proceedButton={{ label: proceedButtonLabel }}
    {canProceed}
  />
</ControlledModal>
