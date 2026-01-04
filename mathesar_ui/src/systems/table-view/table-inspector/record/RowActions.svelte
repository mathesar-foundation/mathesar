<script lang="ts">
  import {
    iconDeleteMajor,
    iconDuplicateRecord,
    iconLinkToRecordPage,
    iconModalRecordView,
  } from '@mathesar/icons';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import { modalRecordViewContext } from '@mathesar/systems/record-view-modal/modalRecordViewContext';
  import { AnchorButton, Button, Icon } from '@mathesar-component-library';

  import {
    type RowAction,
    getRowActionsData,
  } from '../../row-actions/RowActionsDataProvider';

  const tabularData = getTabularDataStoreFromContext();
  const modalRecordView = modalRecordViewContext.get();

  $: ({ selection } = $tabularData);
  $: selectedRowIds = Array.from($selection.rowIds);
  $: rowActionsData = getRowActionsData({
    rowIds: selectedRowIds,
    tabularData: $tabularData,
    modalRecordView,
  });

  function getActionIcon(action: RowAction) {
    switch (action.id) {
      case 'quick-view-record':
        return iconModalRecordView;
      case 'open-record':
        return iconLinkToRecordPage;
      case 'duplicate-record':
        return iconDuplicateRecord;
      case 'delete-records':
        return iconDeleteMajor;
      default:
        return iconModalRecordView;
    }
  }
</script>

<div class="actions-container">
  {#each rowActionsData.actions as action}
    {@const actionIcon = getActionIcon(action)}
    {#if action.href}
      <AnchorButton href={action.href} appearance="action">
        <Icon {...actionIcon} />
        <span>{action.label}</span>
      </AnchorButton>
    {:else if actionIcon}
      <Button
        on:click={() => action.onClick?.()}
        disabled={action.disabled}
        appearance={action.danger ? 'danger' : 'action'}
      >
        <Icon {...actionIcon} />
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
