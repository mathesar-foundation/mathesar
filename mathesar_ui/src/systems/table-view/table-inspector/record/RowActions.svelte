<script lang="ts">
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import { modalRecordViewContext } from '@mathesar/systems/record-view-modal/modalRecordViewContext';
  import { getRowActions } from '@mathesar/systems/table-view/row-actions/getRowActions';
  import { AnchorButton, Button, Icon } from '@mathesar-component-library';

  const tabularData = getTabularDataStoreFromContext();
  const modalRecordView = modalRecordViewContext.get();

  $: ({ selection, canDeleteRecords, canInsertRecords, canViewLinkedEntities } =
    $tabularData);
  $: selectedRowIds = $selection.rowIds;
  $: actions = getRowActions({
    rowIds: selectedRowIds,
    tabularData: $tabularData,
    modalRecordView,
    permissions: {
      canDeleteRecords: $canDeleteRecords,
      canInsertRecords: $canInsertRecords,
      canViewLinkedEntities: $canViewLinkedEntities,
    },
  });
</script>

<div class="actions-container">
  {#each actions as action}
    {#if action.type === 'hyperlink'}
      <AnchorButton href={action.href} appearance="action">
        {#if action.icon}<Icon {...action.icon} />{/if}
        <span>{action.label}</span>
      </AnchorButton>
    {:else}
      <Button
        on:click={action.onClick}
        disabled={action.disabled}
        appearance={action.danger ? 'danger' : 'action'}
      >
        {#if action.icon}<Icon {...action.icon} />{/if}
        <span>{action.label}</span>
      </Button>
    {/if}
  {/each}
</div>

<style lang="scss">
  .actions-container {
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 0.5rem;
    }
  }
</style>
