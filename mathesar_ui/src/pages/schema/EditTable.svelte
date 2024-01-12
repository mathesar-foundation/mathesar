<script lang="ts">
  import { _ } from 'svelte-i18n';
  import type { TableEntry } from '@mathesar/api/types/tables';
  import type { ModalController } from '@mathesar-component-library';
  import EditTableHoc from '@mathesar/components/EditTableHOC.svelte';
  import Identifier from '@mathesar/components/Identifier.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import NameAndDescInputModalForm from '@mathesar/components/NameAndDescInputModalForm.svelte';

  export let table: TableEntry;
  export let modalController: ModalController;
</script>

<EditTableHoc let:getNameValidationErrors let:onUpdate tableId={table.id}>
  <NameAndDescInputModalForm
    controller={modalController}
    save={(name, description) => onUpdate({ name, description })}
    {getNameValidationErrors}
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
</EditTableHoc>
