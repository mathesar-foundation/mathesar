<script lang="ts">
  import { router } from 'tinro';

  import { Help, Icon } from '@mathesar-component-library';
  import {
    iconDeleteMajor,
    iconExploration,
    iconTableLink,
  } from '@mathesar/icons';
  import { confirmDelete } from '@mathesar/stores/confirmation';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import { deleteTable, refetchTablesForSchema } from '@mathesar/stores/tables';
  import { currentSchemaId } from '@mathesar/stores/schemas';
  import {
    getDataExplorerPageUrl,
    getSchemaPageUrl,
  } from '@mathesar/routes/urls';
  import { currentDatabase } from '@mathesar/stores/databases';
  import { modal } from '@mathesar/stores/modal';
  import LinkTableModal from '../../link-table/LinkTableModal.svelte';
  import ActionItem from '../ActionItem.svelte';

  const tabularData = getTabularDataStoreFromContext();
  const linkTableModal = modal.spawnModalController();
  const tableConstraintsModal = modal.spawnModalController();

  function handleDeleteTable() {
    void confirmDelete({
      identifierType: 'Table',
      onProceed: async () => {
        await deleteTable($tabularData.id);
        // TODO handle error when deleting
        // TODO: Get db and schema from prop or context
        if ($currentDatabase && $currentSchemaId) {
          await refetchTablesForSchema($currentSchemaId);
          router.goto(
            getSchemaPageUrl($currentDatabase.name, $currentSchemaId),
            true,
          );
        }
      },
    });
  }
</script>

<div class="actions-container">
  <ActionItem on:click={() => linkTableModal.open()}>
    <Icon {...iconTableLink} />
    <span>Link Table</span>
  </ActionItem>
  <LinkTableModal
    controller={linkTableModal}
    on:goToConstraints={() => tableConstraintsModal.open()}
  />

  {#if $currentDatabase && $currentSchemaId}
    <ActionItem type="link">
      <Icon {...iconExploration} />
      <a
        class="btn-link"
        href={getDataExplorerPageUrl($currentDatabase.name, $currentSchemaId)}
        >Explore Data</a
      >
      <span>
        Explore Data
        <Help>
          Open this table in Data Explorer to query and analyze your data.
        </Help>
      </span>
    </ActionItem>
  {/if}

  <ActionItem danger on:click={handleDeleteTable}>
    <Icon {...iconDeleteMajor} />
    <span>Delete Table</span>
  </ActionItem>
</div>

<style lang="scss">
  .actions-container {
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 0.5rem;
    }
  }
  // TODO: Make this generic - maybe a component that tackles this internally?
  .btn-link {
    position: absolute;
    color: inherit;
    text-decoration: none;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    color: transparent;
  }
</style>
