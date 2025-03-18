<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { Schema } from '@mathesar/models/Schema';
  import {
    ControlledModal,
    type ModalController,
  } from '@mathesar-component-library';

  import CreateTableForm from './CreateTableForm.svelte';

  export let controller: ModalController;
  export let schema: Schema;
  export let existingTableNames: Set<string>;
</script>

<ControlledModal {controller}>
  <span slot="title">{$_('create_new_table')}</span>
  <CreateTableForm
    {schema}
    {existingTableNames}
    close={() => controller.close()}
  />
</ControlledModal>
