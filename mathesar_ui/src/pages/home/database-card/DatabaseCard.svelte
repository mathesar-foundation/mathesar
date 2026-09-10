<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { Database } from '@mathesar/models/Database';
  import { getDatabasePageUrl } from '@mathesar/routes/urls';
  import { databasesStore } from '@mathesar/stores/databases';
  import { modal } from '@mathesar/stores/modal';
  import { toast } from '@mathesar/stores/toast';
  import EditDatabaseModal from '@mathesar/systems/databases/edit-database/EditDatabaseModal.svelte';

  import DisconnectDatabaseModal from '../../database/disconnect/DisconnectDatabaseModal.svelte';

  import DatabaseCardContent from './DatabaseCardContent.svelte';

  export let database: Database;

  $: href = getDatabasePageUrl(database.id);

  const disconnectModalController = modal.spawnModalController<Database>();
  const editModalController = modal.spawnModalController();

  function openDisconnect() {
    disconnectModalController.open(database);
  }

  function openEdit() {
    editModalController.open();
  }
</script>

<div class="db-card">
  <DatabaseCardContent {database} {href} {openDisconnect} {openEdit} />
</div>

<EditDatabaseModal controller={editModalController} {database} />
<DisconnectDatabaseModal
  controller={disconnectModalController}
  disconnect={async (opts) => {
    await databasesStore.disconnectDatabase(opts);
    toast.success($_('database_disconnected_successfully'));
  }}
/>

<style lang="scss">
  .db-card {
    cursor: pointer;
  }
</style>
