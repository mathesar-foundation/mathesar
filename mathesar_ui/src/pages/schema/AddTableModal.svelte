<script lang="ts">
  import { map, some } from 'iter-tools';
  import { _ } from 'svelte-i18n';

  import NameAndDescInputModalForm from '@mathesar/components/NameAndDescInputModalForm.svelte';
  import type { Schema } from '@mathesar/models/Schema';
  import type { Table } from '@mathesar/models/Table';
  import { createTable } from '@mathesar/stores/tables';
  import type { ModalController } from '@mathesar-component-library';

  export let controller: ModalController;
  export let schema: Schema;
  export let tablesMap: Map<Table['oid'], Table>;

  function getInitialName() {
    const names = new Set(map((table) => table.name, tablesMap.values()));
    function makeName(i: number): string {
      const name = `${$_('table')} ${i}`;
      return names.has(name) ? makeName(i + 1) : name;
    }
    return makeName(1);
  }

  function getNameValidationErrors(name: string) {
    if (some((table) => table.name === name, tablesMap.values())) {
      return [$_('table_name_already_exists')];
    }
    return [];
  }

  async function handleSave(name: string, description: string) {
    await createTable({ schema, name, description });
    controller.close();
  }
</script>

<NameAndDescInputModalForm
  {controller}
  save={handleSave}
  {getNameValidationErrors}
  {getInitialName}
>
  <span slot="title">{$_('create_new_table')}</span>
</NameAndDescInputModalForm>
