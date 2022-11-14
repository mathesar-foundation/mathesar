<script lang="ts">
  import type { TableEntry } from '@mathesar/api/tables';
  import type { ModalController } from '@mathesar/component-library';
  import EditTableHoc from '@mathesar/components/EditTableHOC.svelte';
  import Identifier from '@mathesar/components/Identifier.svelte';
  import NameAndDescInputModalForm from '@mathesar/components/NameAndDescInputModalForm.svelte';

  export let table: TableEntry;
  export let modalController: ModalController;
</script>

<EditTableHoc let:getNameValidationErrors let:onUpdate tableId={table.id}>
  <NameAndDescInputModalForm
    controller={modalController}
    save={onUpdate}
    {getNameValidationErrors}
    getInitialName={() => table.name ?? ''}
    getInitialDescription={() => ''}
    hideDescription
  >
    <span slot="title" let:initialName>
      Edit <Identifier>{initialName}</Identifier> Table
    </span>
  </NameAndDescInputModalForm>
</EditTableHoc>
