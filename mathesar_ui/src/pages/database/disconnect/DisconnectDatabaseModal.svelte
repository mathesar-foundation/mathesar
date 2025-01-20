<script lang="ts">
  import { _ } from 'svelte-i18n';

  import RichText from '@mathesar/components/rich-text/RichText.svelte';
  import type { Database } from '@mathesar/models/Database';
  import type { DatabaseDisconnectFn } from '@mathesar/stores/databases';
  import {
    ControlledModal,
    type ModalController,
  } from '@mathesar-component-library';

  import DisconnectDatabaseForm from './DisconnectDatabaseForm.svelte';

  export let controller: ModalController<Database>;
  export let disconnect: DatabaseDisconnectFn;
</script>

<ControlledModal {controller} let:options={database}>
  <span slot="title">
    <RichText text={$_('disconnect_named_database')} let:slotName>
      {#if slotName === 'databaseName'}
        <b>{database.name}</b>
      {/if}
    </RichText>
  </span>
  <DisconnectDatabaseForm
    {database}
    {disconnect}
    cancel={() => controller.close()}
  />
</ControlledModal>
