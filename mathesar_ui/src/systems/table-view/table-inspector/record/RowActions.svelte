<script lang="ts">
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import { AnchorButton, Button, Icon } from '@mathesar-component-library';
  import RecordActions from '../../row-actions/RecordActions.svelte';

  const tabularData = getTabularDataStoreFromContext();

  $: ({ selection } = $tabularData);
  $: selectedRowIds = $selection.rowIds;
</script>

<div class="actions-container">
  <RecordActions rowIds={new Set(selectedRowIds)} let:actions>
    {#each actions as action (action.key)}
      {#if action.type === 'button'}
        <Button
          on:click={action.onClick}
          disabled={action.disabled}
          appearance={action.danger ? 'danger' : 'action'}
        >
          <Icon {...action.icon} />
          <span>{action.label}</span>
        </Button>
      {:else if action.type === 'link' && action.href}
        <AnchorButton href={action.href} appearance="action">
          <Icon {...action.icon} />
          <span>{action.label}</span>
        </AnchorButton>
      {/if}
    {/each}
  </RecordActions>
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
