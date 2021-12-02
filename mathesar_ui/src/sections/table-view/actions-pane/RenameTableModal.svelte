<script lang='ts'>
  import { CancelOrProceedButtonPair, Modal, TextInput } from '@mathesar-component-library';
  import type { TabularData } from '@mathesar/stores/table-data/types';
  import { refetchTablesForSchema, renameTable, tables } from '@mathesar/stores/tables';
  import { toast } from '@mathesar/stores/toast';
  import { currentSchemaId } from '@mathesar/stores/schemas';
  import { constructTabularTab, getTabsForSchema } from '@mathesar/stores/tabs';
  import { currentDBName } from '@mathesar/stores/databases';
  import { TabularType } from '@mathesar/App.d';

  export let isOpen: boolean;
  export let tabularData: TabularData;

  let allowClose = true;
  
  let originalName = '';
  let name = '';

  function getNameValidationErrors(_name: string): string[] {
    const errors: string[] = [];
    if (_name.length === 0) {
      errors.push('Name cannot be empty.');
    }
    return errors;
  }

  $: validationErrors = getNameValidationErrors(name);
  $: canProceed = !validationErrors.length;
  $: tabList = getTabsForSchema($currentDBName, $currentSchemaId);

  function init() {
    originalName = $tables.data.get(tabularData.id)?.name ?? '';
    name = originalName;
  }
  
  async function handleSave() {
    try {
      allowClose = false;
      const { id } = tabularData;
      await renameTable(id, name);
      await refetchTablesForSchema($currentSchemaId);
      const existingTab = tabList.getTabularTabByTabularID(TabularType.Table, id);
      if (existingTab) {
        const newTab = constructTabularTab(TabularType.Table, id, name);
        tabList.replace(existingTab, newTab);
      }
      isOpen = false;
    } catch (error) {
      toast.fromError(error);
    } finally {
      allowClose = true;
    }
  }
</script>

<Modal bind:isOpen={isOpen} let:close {allowClose} on:open={init}>
  <span slot=title>Rename <em>{originalName}</em> Table</span>
  <!-- TODO add label -->
  <!-- TODO auto focus and select -->
  <TextInput bind:value={name} />
  {#if validationErrors.length}
    <div class='error'>
      {validationErrors.join(' ')}
    </div>
  {/if}
  <CancelOrProceedButtonPair
    slot=footer
    proceed={{ label: 'Save' }}
    onCancel={close}
    onProceed={handleSave}
    {canProceed}
  />
</Modal>
