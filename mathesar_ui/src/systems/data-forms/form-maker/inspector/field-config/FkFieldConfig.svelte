<script lang="ts">
  import { _ } from 'svelte-i18n';

  import InspectorSection from '@mathesar/components/InspectorSection.svelte';
  import RecordSummaryConfig from '@mathesar/systems/table-view/table-inspector/record-summary/RecordSummaryConfig.svelte';
  import { Spinner } from '@mathesar-component-library';

  import type { EditableDataFormManager } from '../../data-form-utilities/DataFormManager';
  import type { FkField } from '../../data-form-utilities/fields';
  import FkFormFieldRuleSelector from '../../elements/FkFormFieldRuleSelector.svelte';

  export let dataFormManager: EditableDataFormManager;
  export let field: FkField;

  $: ({ interactionRule } = field);

  $: linkedTableStructure = dataFormManager.getTableStructure(
    field.relatedTableOid,
  );
  $: ({
    table: linkedTable,
    processedColumns,
    isLoading,
  } = linkedTableStructure);
</script>

<InspectorSection title={$_('field_fk_rule_label')}>
  <FkFormFieldRuleSelector
    appearance="default"
    {dataFormManager}
    dataFormField={field}
  />
</InspectorSection>

{#if $interactionRule !== 'must_create'}
  <InspectorSection title={$_('linked_record_summary')}>
    {#if $isLoading}
      <Spinner />
    {:else if $linkedTable}
      <RecordSummaryConfig
        table={$linkedTable}
        processedColumns={$processedColumns}
        isLoading={$isLoading}
        onSave={() => linkedTableStructure.refetch()}
      />
    {/if}
  </InspectorSection>
{/if}
