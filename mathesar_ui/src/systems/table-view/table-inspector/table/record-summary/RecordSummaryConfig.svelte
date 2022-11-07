<script lang="ts">
  import { onMount } from 'svelte';

  import {
    Alert,
    CancelOrProceedButtonPair,
    FormattedInput,
    RadioGroup,
  } from '@mathesar-component-library';
  import type { Column } from '@mathesar/api/tables/columns';
  import Identifier from '@mathesar/components/Identifier.svelte';
  import LinkedRecord from '@mathesar/components/LinkedRecord.svelte';
  import {
    getTabularDataStoreFromContext,
    type RecordRow,
  } from '@mathesar/stores/table-data';
  import { renderRecordSummaryForRow } from '@mathesar/stores/table-data/record-summaries/recordSummaryUtils';
  import { currentTable } from '@mathesar/stores/tables';
  import InsertColumn from './InsertColumn.svelte';
  import {
    columnIsConformant,
    getColumnsInTemplate,
  } from './recordSummaryTemplateUtils';
  import TemplateInputFormatter from './TemplateInputFormatter';

  type TemplateType = 'Default' | 'Custom';
  const templateTypes: TemplateType[] = ['Default', 'Custom'];
  const tabularData = getTabularDataStoreFromContext();

  let templateType: TemplateType = 'Default';
  let template = '';

  $: ({ recordsData, columnsDataStore } = $tabularData);
  $: ({ columns } = columnsDataStore);
  $: ({ savedRecords } = recordsData);
  $: firstRow = $savedRecords[0] as RecordRow | undefined;
  $: table = $currentTable;
  $: formatter = new TemplateInputFormatter($columns);
  $: columnsInTemplate =
    templateType === 'Default'
      ? []
      : getColumnsInTemplate({ columns: $columns, template });
  $: nonconformantColumns = columnsInTemplate.filter(
    (column) => !columnIsConformant(column),
  );

  function init() {
    template = table ? table.settings.preview_settings.template : '';
  }
  onMount(init);
  $: table, init();
  $: previewRecordSummary = (() => {
    if (!table || !firstRow) {
      return undefined;
    }
    const { record } = firstRow;
    return renderRecordSummaryForRow({ template, record });
  })();

  function insertColumn(column: Column) {
    template = `${template}{${column.id}}`;
  }

  async function save() {
    // TODO
    await Promise.resolve();
  }
</script>

{#if previewRecordSummary}
  <div>Preview</div>
  <LinkedRecord recordSummary={previewRecordSummary} />
{/if}

<div>Template</div>
<RadioGroup options={templateTypes} isInline bind:value={templateType} />

{#if templateType === 'Custom'}
  <InsertColumn columns={$columns} onSelect={insertColumn} />
  <FormattedInput {formatter} bind:value={template} />
{/if}

{#if nonconformantColumns.length}
  <Alert>
    <div class="nonconformant-columns">
      <p>
        Because some column names contain curly braces, the following numerical
        values are used in place of column names:
      </p>
      <ul>
        {#each nonconformantColumns as column}
          <li>
            <Identifier>{column.id}</Identifier>
            references the column <Identifier>{column.name}</Identifier>.
          </li>
        {/each}
      </ul>
    </div>
  </Alert>
{/if}

<CancelOrProceedButtonPair
  onProceed={save}
  onCancel={init}
  proceedButton={{ label: 'Save' }}
/>

<style>
  .nonconformant-columns > :global(:first-child) {
    margin-top: 0;
  }
  .nonconformant-columns > :global(:last-child) {
    margin-bottom: 0;
  }
  .nonconformant-columns ul {
    padding-left: 1.5rem;
  }
</style>
