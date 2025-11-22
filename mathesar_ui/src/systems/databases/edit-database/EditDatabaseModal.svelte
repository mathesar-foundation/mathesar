<script lang="ts">
  import { _ } from 'svelte-i18n';

  import Identifier from '@mathesar/components/Identifier.svelte';
  import RichText from '@mathesar/components/rich-text/RichText.svelte';
  import type { Database } from '@mathesar/models/Database';
  import {
    ControlledModal,
    type ModalController,
  } from '@mathesar-component-library';

  import EditDatabaseForm from './EditDatabaseForm.svelte';

  export let controller: ModalController;
  export let database: Database;
</script>

<ControlledModal {controller} size="medium">
  <span slot="title">
    <RichText text={$_('edit_named_database_connection')} let:slotName>
      {#if slotName === 'name'}
        <Identifier>{database.displayName}</Identifier>
      {/if}
    </RichText>
  </span>
  <EditDatabaseForm {database} close={() => controller.close()} />
</ControlledModal>
