<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { Schema } from '@mathesar/models/Schema';
  import {
    ControlledModal,
    type ModalController,
  } from '@mathesar-component-library';

  import CreateTableForm from './CreateTableForm.svelte';
  import CreateTableWithAiForm from './CreateTableWithAiForm.svelte';

  export let controller: ModalController;
  export let schema: Schema;
  export let existingTableNames: Set<string>;
  export let useAi = false;
</script>

<ControlledModal {controller}>
  <span slot="title">
    {useAi ? $_('create_table_with_ai') : $_('create_new_table')}
  </span>
  {#if useAi}
    <CreateTableWithAiForm {schema} close={() => controller.close()} />
  {:else}
    <CreateTableForm
      {schema}
      {existingTableNames}
      close={() => controller.close()}
    />
  {/if}
</ControlledModal>
