<script lang="ts">
  import { Button, Icon } from '@mathesar/component-library';
  import { iconDelete, iconExploration, iconTableLink } from '@mathesar/icons';
  import { confirmDelete } from '@mathesar/stores/confirmation';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import { deleteTable, refetchTablesForSchema } from '@mathesar/stores/tables';
  import { createEventDispatcher } from 'svelte';
  import { currentSchemaId } from '@mathesar/stores/schemas';
  import { getDataExplorerPageUrl } from '@mathesar/routes/urls';
  import { currentDatabase } from '@mathesar/stores/databases';
  import { modal } from '@mathesar/stores/modal';
  import LinkTableModal from '../../link-table/LinkTableModal.svelte';

  const dispatch = createEventDispatcher();
  const tabularData = getTabularDataStoreFromContext();
  const linkTableModal = modal.spawnModalController();
  const tableConstraintsModal = modal.spawnModalController();

  function handleDeleteTable() {
    void confirmDelete({
      identifierType: 'Table',
      onProceed: async () => {
        await deleteTable($tabularData.id);
        // TODO handle error when deleting
        dispatch('deleteTable');
        if ($currentSchemaId) {
          await refetchTablesForSchema($currentSchemaId);
        }
      },
    });
  }
</script>

<div class="actions-container">
  <Button appearance="ghost" on:click={() => linkTableModal.open()}>
    <Icon {...iconTableLink} />
    <span>Link Table</span>
  </Button>
  <LinkTableModal
    controller={linkTableModal}
    on:goToConstraints={() => tableConstraintsModal.open()}
  />

  {#if $currentDatabase && $currentSchemaId}
    <Button appearance="ghost">
      <Icon {...iconExploration} />
      <a
        class="btn-link"
        href={getDataExplorerPageUrl($currentDatabase.name, $currentSchemaId)}
        >Explore Data</a
      >
    </Button>
  {/if}

  <Button appearance="ghost" on:click={handleDeleteTable}>
    <Icon {...iconDelete} />
    <span>Delete Table</span>
  </Button>
</div>

<style>
  .actions-container {
    display: flex;
    flex-direction: column;
  }
  .btn-link {
    color: inherit;
    text-decoration: none;
  }
</style>
