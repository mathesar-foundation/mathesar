<script lang="ts">
  import { _ } from 'svelte-i18n';

  import InspectorSection from '@mathesar/components/InspectorSection.svelte';
  import InspectorTabContent from '@mathesar/components/InspectorTabContent.svelte';
  import TableName from '@mathesar/components/TableName.svelte';
  import {
    LabeledInput,
    TextArea,
    TextInput,
  } from '@mathesar-component-library';

  import type { EditableDataFormManager } from '../../data-form-utilities/DataFormManager';

  import AssociatedRoleSelector from './AssociatedRoleSelector.svelte';
  import SubmissionSettings from './SubmissionSettings.svelte';

  export let dataFormManager: EditableDataFormManager;

  $: ({ ephemeralDataForm } = dataFormManager);
  $: ({ headerTitle, headerSubTitle, baseTableOid } = ephemeralDataForm);
  $: tableStructure = dataFormManager.getTableStructure(baseTableOid);
  $: tableStructureStore = tableStructure.asyncStore;
  $: table = $tableStructureStore.resolvedValue?.table;

  function getInputValue(e: Event) {
    const element = e.target as HTMLInputElement;
    return element.value;
  }
</script>

<InspectorTabContent>
  <InspectorSection title={$_('header')}>
    <LabeledInput layout="stacked" label={$_('form_title')}>
      <TextInput
        value={$headerTitle.text}
        on:input={(e) => ephemeralDataForm.setHeaderTitle(getInputValue(e))}
      />
    </LabeledInput>
    <LabeledInput layout="stacked" label={$_('form_subtitle')}>
      <TextArea
        value={$headerSubTitle?.text}
        on:input={(e) => ephemeralDataForm.setHeaderSubTitle(getInputValue(e))}
      />
    </LabeledInput>
  </InspectorSection>
  <InspectorSection title={$_('source')}>
    <div>
      <div>{$_('source_table')}</div>
      {#if table}
        <TableName {table} />
      {/if}
    </div>
  </InspectorSection>
  <InspectorSection title={$_('associated_role')}>
    <AssociatedRoleSelector {dataFormManager} />
  </InspectorSection>
  <InspectorSection title={$_('submission_settings')}>
    <SubmissionSettings {dataFormManager} />
  </InspectorSection>
</InspectorTabContent>
