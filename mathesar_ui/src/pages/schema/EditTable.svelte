<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { ModalController } from '@mathesar-component-library';
  import type { Table } from '@mathesar/api/rpc/tables';
  import Identifier from '@mathesar/components/Identifier.svelte';
  import NameAndDescInputModalForm from '@mathesar/components/NameAndDescInputModalForm.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import { currentConnection } from '@mathesar/stores/databases';
  import {
    factoryToGetTableNameValidationErrors,
    updateTable,
  } from '@mathesar/stores/tables';

  export let table: Table;
  export let modalController: ModalController;

  $: getNameValidationErrors = factoryToGetTableNameValidationErrors(
    $currentConnection,
    table,
  );

  async function handleSave(name: string, description: string) {
    updateTable($currentConnection, {
      oid: table.oid,
      name,
      description,
    });
  }
</script>

<NameAndDescInputModalForm
  controller={modalController}
  save={handleSave}
  getNameValidationErrors={$getNameValidationErrors}
  getInitialName={() => table.name ?? ''}
  getInitialDescription={() => table.description ?? ''}
>
  <span slot="title" let:initialName>
    <RichText text={$_('edit_table_with_name')} let:slotName>
      {#if slotName === 'tableName'}
        <Identifier>{initialName}</Identifier>
      {/if}
    </RichText>
  </span>
</NameAndDescInputModalForm>
