<script lang="ts">
  import { _ } from 'svelte-i18n';

  import Fieldset from '@mathesar/component-library/fieldset/Fieldset.svelte';
  import {
    FormSubmit,
    makeForm,
    requiredField,
  } from '@mathesar/components/form';
  import type {
    ProcessedColumn,
    ProcessedColumns,
  } from '@mathesar/stores/table-data';
  import { portalToWindowFooter } from '@mathesar-component-library';

  import ImportMappingField from './ImportMappingField.svelte';
  import {
    type CsvPreviewField,
    getAvailableTableColumns,
    guessCsvImportMapping,
  } from './importUtils';

  export let fields: CsvPreviewField[];
  export let tableColumns: ProcessedColumns;

  $: availableTableColumns = getAvailableTableColumns(tableColumns);
  $: mapping = requiredField(
    guessCsvImportMapping({ csvColumns: fields, availableTableColumns }),
  );
  $: form = makeForm({ mapping });

  function setMappingEntry(
    index: number,
    newColumn: ProcessedColumn | undefined,
  ): void {
    let newMapping = [...$mapping];
    if (newColumn) {
      // Remove table column from any previous mappings
      newMapping = newMapping.map((c) =>
        c?.id === newColumn.id ? undefined : c,
      );
    }
    newMapping[index] = newColumn;
    $mapping = newMapping;
  }

  async function submit() {
    // TODO
  }
</script>

<Fieldset boxed label={$_('column_mapping')}>
  <div class="fields">
    <div class="header">{$_('csv_column')}</div>
    <div class="header">{$_('sample_value')}</div>
    <div></div>
    <div class="header">{$_('destination')}</div>

    {#each fields as field, index}
      <ImportMappingField
        {field}
        {availableTableColumns}
        mappedColumn={$mapping.at(index)}
        onUpdate={(newColumn) => setMappingEntry(index, newColumn)}
      />
    {/each}
  </div>
</Fieldset>

<div use:portalToWindowFooter>
  <FormSubmit
    {form}
    catchErrors
    canProceed={$mapping.some(Boolean)}
    hasCancelButton={false}
    onProceed={submit}
    proceedButton={{ label: $_('import') }}
  />
</div>

<style>
  .fields {
    display: grid;
    --col: minmax(0, max-content);
    grid-template-columns: var(--col) var(--col) auto var(--col);
    gap: var(--sm1);
    align-items: center;
    justify-content: start;
  }
  .header {
    font-weight: bold;
  }
</style>
