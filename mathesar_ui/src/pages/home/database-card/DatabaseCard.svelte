<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { router } from 'tinro';
  import type { Database } from '@mathesar/models/Database';
  import { getDatabasePageUrl } from '@mathesar/routes/urls';
  import { modal } from '@mathesar/stores/modal';
  import { databasesStore } from '@mathesar/stores/databases';
  import { toast } from '@mathesar/stores/toast';

  import DisconnectDatabaseModal from '../../database/disconnect/DisconnectDatabaseModal.svelte';
  import EditDatabaseModal from '@mathesar/systems/databases/edit-database/EditDatabaseModal.svelte';
  import UpgradeDatabaseModal from '@mathesar/systems/databases/upgrade-database/UpgradeDatabaseModal.svelte';

  import DatabaseCardContent from './DatabaseCardContent.svelte';

  export let database: Database;
  export let onTriggerUpgrade: (database: Database) => void;

  $: needsUpgrade = database.needsUpgradeAttention;
  $: href = getDatabasePageUrl(database.id);

  const disconnectModalController = modal.spawnModalController<Database>();
  const editModalController = modal.spawnModalController();
  const reinstallModalController = modal.spawnModalController<Database>();

  function openDisconnect() {
    disconnectModalController.open(database);
  }

  function openEdit() {
    editModalController.open();
  }

  function openReinstall() {
    reinstallModalController.open(database);
  }
</script>

<div class="db-card" class:hoverable={!needsUpgrade}>
  <DatabaseCardContent
    {database}
    {href}
    {openDisconnect}
    {openEdit}
    {openReinstall}
    upgradeRequired={needsUpgrade}
    onTriggerUpgrade={needsUpgrade ? onTriggerUpgrade : undefined}
  />
</div>

<EditDatabaseModal controller={editModalController} {database} />
<UpgradeDatabaseModal
  controller={reinstallModalController}
  isReinstall
  refreshDatabaseList={() => databasesStore.refresh()}
/>
<DisconnectDatabaseModal
  controller={disconnectModalController}
  disconnect={async (opts) => {
    const result = await databasesStore.disconnectDatabase(opts);
    if (result.sql_cleaned) {
      toast.success($_('database_disconnected_successfully'));
    } else {
      toast.success($_('database_disconnected_without_sql_cleanup'));
    }
    return result;
  }}
/>

<style lang="scss">
  .db-card.hoverable {
    cursor: pointer;
  }
</style>
