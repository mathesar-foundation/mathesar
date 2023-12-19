<script lang="ts">
  import { _ } from 'svelte-i18n';

  import {
    ControlledModal,
    type ModalController,
  } from '@mathesar-component-library';
  import AddConnection from './AddConnection.svelte';

  export let controller: ModalController;
</script>

<ControlledModal
  {controller}
  size="large"
  title={$_('new_postgresql_database_connection')}
>
  <AddConnection onExit={() => controller.close()} />
</ControlledModal>
