<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import { modalRecordViewContext } from '@mathesar/systems/record-view-modal/modalRecordViewContext';
  import { AnchorButton, Button, Icon } from '@mathesar-component-library';
  import { getRowActions } from '@mathesar/systems/table-view/row-actions';

  const tabularData = getTabularDataStoreFromContext();
  const modalRecordView = modalRecordViewContext.get();

  $: ({ selection } = $tabularData);
  $: selectedRowIds = $selection.rowIds;
  $: rowIdsArray = Array.from(selectedRowIds);
  
  // Get row actions using the headless component
  $: actions = Array.from(
    getRowActions({
      rowIds: rowIdsArray,
      tabularData: $tabularData,
      modalRecordView,
    }),
  );
</script>

<div class="actions-container">
  {#each actions as action (action.type)}
    {#if action.href}
      <AnchorButton href={action.href} appearance="action">
        <Icon {...action.icon} />
        <span>{action.label}</span>
      </AnchorButton>
    {:else}
      <Button
        on:click={action.onClick}
        disabled={action.disabled}
        appearance={action.danger ? 'danger' : 'action'}
      >
        <Icon {...action.icon} />
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
