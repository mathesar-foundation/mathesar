<script lang="ts">
  import { _ } from 'svelte-i18n';

  import InspectorSection from '@mathesar/components/InspectorSection.svelte';
  import InspectorTabContent from '@mathesar/components/InspectorTabContent.svelte';
  import TableName from '@mathesar/components/TableName.svelte';
  import { iconDeleteMajor } from '@mathesar/icons';
  import { confirmDelete } from '@mathesar/stores/confirmation';
  import {
    Button,
    Icon,
    LabeledInput,
    TextArea,
    TextInput,
    getStringValueFromEvent,
  } from '@mathesar-component-library';

  import type { EditableDataFormManager } from '../../data-form-utilities/DataFormManager';

  import AssociatedRoleSelector from './AssociatedRoleSelector.svelte';
  import SubmissionSettings from './SubmissionSettings.svelte';

  export let dataFormManager: EditableDataFormManager;

  $: ({ dataFormStructure, deleteDataForm } = dataFormManager);
  $: ({ name, description, baseTableOid } = dataFormStructure);
  $: tableStructure = dataFormManager.getTableStructure(baseTableOid);
  $: ({ table } = tableStructure);

  function handleDelete() {
    void confirmDelete({
      identifierType: $_('form'),
      identifierName: $name,
      onProceed: async () => {
        await deleteDataForm();
      },
    });
  }
</script>

<InspectorTabContent>
  <InspectorSection title={$_('properties')}>
    <LabeledInput layout="stacked" label={$_('name')}>
      <TextInput
        value={$name}
        on:input={(e) => dataFormStructure.setName(getStringValueFromEvent(e))}
      />
    </LabeledInput>
    <LabeledInput layout="stacked" label={$_('description')}>
      <TextArea
        value={$description}
        on:input={(e) =>
          dataFormStructure.setDescription(getStringValueFromEvent(e))}
      />
    </LabeledInput>
    <div>
      <div>{$_('base_table')}</div>
      {#if $table}
        <TableName table={$table} />
      {/if}
    </div>
  </InspectorSection>
  <InspectorSection title={$_('associated_role')}>
    <AssociatedRoleSelector {dataFormManager} />
  </InspectorSection>
  <InspectorSection title={$_('submission_settings')}>
    <SubmissionSettings {dataFormManager} />
  </InspectorSection>
  <InspectorSection title={$_('actions')}>
    <Button appearance="outline-danger" on:click={handleDelete}>
      <Icon {...iconDeleteMajor} />
      <span>{$_('delete_form')}</span>
    </Button>
  </InspectorSection>
</InspectorTabContent>
