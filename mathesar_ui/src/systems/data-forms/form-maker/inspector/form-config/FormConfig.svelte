<script lang="ts">
  import { _ } from 'svelte-i18n';

  import InspectorSection from '@mathesar/components/InspectorSection.svelte';
  import InspectorTabContent from '@mathesar/components/InspectorTabContent.svelte';
  import TableLink from '@mathesar/components/TableLink.svelte';
  import { iconDeleteMajor } from '@mathesar/icons';
  import { confirmDelete } from '@mathesar/stores/confirmation';
  import {
    Button,
    Help,
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
        on:blur={() => dataFormManager.checkAndSetDefaultFormName()}
      />
    </LabeledInput>
    <LabeledInput layout="stacked" label={$_('description')}>
      <TextArea
        value={$description}
        on:input={(e) =>
          dataFormStructure.setDescription(getStringValueFromEvent(e))}
      />
    </LabeledInput>
    {#if $table}
      <div class="source-info">
        <span>{$_('base_table')}:</span>
        <TableLink table={$table} boxed />
      </div>
    {/if}
  </InspectorSection>
  <InspectorSection>
    <div slot="title">
      {$_('associated_role')}
      <Help>{$_('associated_role_help')}</Help>
    </div>
    <AssociatedRoleSelector {dataFormManager} />
  </InspectorSection>
  <InspectorSection title={$_('submission_settings')}>
    <SubmissionSettings {dataFormManager} />
  </InspectorSection>
  <InspectorSection title={$_('actions')}>
    <Button appearance="danger" on:click={handleDelete}>
      <Icon {...iconDeleteMajor} />
      <span>{$_('delete_form')}</span>
    </Button>
  </InspectorSection>
</InspectorTabContent>

<style lang="scss">
  .source-info {
    display: flex;
    gap: var(--sm4);
    align-items: center;
  }
</style>
