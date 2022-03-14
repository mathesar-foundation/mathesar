<script lang="ts">
  import type { ModalController } from '@mathesar-component-library';
  import type { TabularData } from '@mathesar/stores/table-data/types';
  import {
    refetchTablesForSchema,
    renameTable,
    tables,
  } from '@mathesar/stores/tables';
  import { toast } from '@mathesar/stores/toast';
  import { currentSchemaId } from '@mathesar/stores/schemas';
  import { constructTabularTab, getTabsForSchema } from '@mathesar/stores/tabs';
  import { currentDBName } from '@mathesar/stores/databases';
  import { TabularType } from '@mathesar/stores/table-data';

  import ModalTextInputForm from '@mathesar/components/ModalTextInputForm.svelte';
  import Identifier from '@mathesar/components/Identifier.svelte';

  export let controller: ModalController;
  export let tabularData: TabularData;

  function schemaContainsTableName(name: string): boolean {
    const { id } = tabularData;

    const allTables = [...$tables.data.values()];
    const tablesUsingName = allTables.filter(
      (current) => current.name === name,
    );

    return tablesUsingName.length > 0 && tablesUsingName[0].id !== id;
  }

  function getValidationErrors(name: string): string[] {
    if (!name.trim()) {
      return ['Name cannot be empty.'];
    }
    if (schemaContainsTableName(name)) {
      return ['A table with that name already exists.'];
    }
    return [];
  }

  async function save(name: string) {
    try {
      const { id } = tabularData;
      await renameTable(id, name);
      if ($currentSchemaId) {
        await refetchTablesForSchema($currentSchemaId);
        const tabList = getTabsForSchema($currentDBName, $currentSchemaId);
        const existingTab = tabList.getTabularTabByTabularID(
          TabularType.Table,
          id,
        );
        if (existingTab) {
          const newTab = constructTabularTab(TabularType.Table, id, name);
          tabList.replace(existingTab, newTab);
        }
      }
      controller.close();
    } catch (error) {
      toast.fromError(error);
    }
  }
</script>

<ModalTextInputForm
  {controller}
  {save}
  {getValidationErrors}
  getInitialValue={() => $tables.data.get(tabularData.id)?.name ?? ''}
  label="name"
>
  <span slot="title" let:initialValue>
    Rename <Identifier>{initialValue}</Identifier> Table
  </span>
</ModalTextInputForm>
