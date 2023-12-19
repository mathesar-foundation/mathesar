<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { router } from 'tinro';

  import {
    ControlledModal,
    type ModalController,
  } from '@mathesar-component-library';
  import type { Connection } from '@mathesar/api/connections';
  import { getDatabasePageUrl } from '@mathesar/routes/urls';
  import AddConnection from './AddConnection.svelte';

  export let controller: ModalController;

  function handleCancel() {
    controller.close();
  }

  function handleSuccess(connection: Connection) {
    controller.close();
    const url = getDatabasePageUrl(connection.id);
    router.goto(url);
  }
</script>

<ControlledModal
  {controller}
  size="large"
  title={$_('new_postgresql_database_connection')}
>
  <AddConnection onCancel={handleCancel} onSuccess={handleSuccess} />
</ControlledModal>
