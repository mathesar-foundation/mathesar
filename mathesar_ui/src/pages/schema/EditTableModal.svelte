<script lang="ts">
  import { _ } from 'svelte-i18n';

  import Identifier from '@mathesar/components/Identifier.svelte';
  import NameAndDescInputModalForm from '@mathesar/components/NameAndDescInputModalForm.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import type { Table } from '@mathesar/models/Table';
  import {
    factoryToGetTableNameValidationErrors,
    updateTable,
  } from '@mathesar/stores/tables';
  import { isTableView } from '@mathesar/utils/tables';
  import type { ModalController } from '@mathesar-component-library';

  export let table: Table;
  export let controller: ModalController;

  $: getNameValidationErrors = factoryToGetTableNameValidationErrors(table);
  $: isView = isTableView(table);

  async function handleSave(name: string, description: string) {
    await updateTable({
      schema: table.schema,
      table: {
        oid: table.oid,
        name,
        description,
      },
    });
  }
</script>

<NameAndDescInputModalForm
  {controller}
  save={handleSave}
  getNameValidationErrors={$getNameValidationErrors}
  getInitialName={() => table.name}
  getInitialDescription={() => table.description ?? ''}
>
  <span slot="title" let:initialName>
    <RichText
      text={isView ? $_('rename_view_with_name') : $_('rename_table_with_name')}
      let:slotName
    >
      {#if slotName === 'tableName' || slotName === 'viewName'}
        <Identifier>{initialName}</Identifier>
      {/if}
    </RichText>
  </span>
</NameAndDescInputModalForm>
