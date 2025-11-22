<script lang="ts">
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { bulkInsert } from '@mathesar/api/rest/bulkInsert';
  import {
    Button,
    Fieldset,
    Icon,
    Spinner,
    Truncate,
    assertExhaustive,
  } from '@mathesar/component-library';
  import LabeledInput from '@mathesar/component-library/labeled-input/LabeledInput.svelte';
  import Select from '@mathesar/component-library/select/Select.svelte';
  import {
    FormSubmit,
    makeForm,
    requiredField,
  } from '@mathesar/components/form';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import { iconDeleteMajor } from '@mathesar/icons';
  import type { Table } from '@mathesar/models/Table';
  import type { ProcessedColumns } from '@mathesar/stores/table-data';
  import { toast } from '@mathesar/stores/toast';
  import { formatBytes } from '@mathesar/utils/unitUtils';
  import { portalToWindowFooter } from '@mathesar-component-library';

  import FieldMapping from './FieldMapping.svelte';
  import {
    type CsvImportMapping,
    type CsvPreviewResult,
    buildMappingForApi,
    getAvailableTableColumns,
    guessCsvImportMapping,
    parseCsvPreview,
  } from './importUtils';

  export let table: Table;
  export let file: File;
  export let tableColumns: ProcessedColumns;
  export let resetFile: (() => void) | undefined = undefined;
  export let onFinish: () => void;

  let parseResult: CsvPreviewResult | undefined;
  let isParsing = false;

  $: availableTableColumns = getAvailableTableColumns(tableColumns);
  $: hasHeaderRow = requiredField(true);
  $: mapping = requiredField<CsvImportMapping>([]);
  $: form = makeForm({ hasHeaderRow, mapping });

  async function parse() {
    isParsing = true;
    parseResult = await parseCsvPreview(file, { hasHeaderRow: $hasHeaderRow });
    $mapping =
      parseResult.status === 'success'
        ? guessCsvImportMapping({
            csvColumns: parseResult.fields,
            availableTableColumns,
          })
        : [];
    isParsing = false;
  }

  function startParse() {
    void parse();
  }

  async function submit() {
    if (!parseResult) return;
    if (parseResult.status === 'failure') return;
    const { inserted_rows: count } = await bulkInsert({
      database: table.schema.database,
      table,
      file,
      headerRow: $hasHeaderRow,
      columnMapping: buildMappingForApi($mapping, parseResult.fields),
    });
    toast.success($_('imported_count_rows', { values: { count } }));
    onFinish();
  }

  onMount(startParse);
</script>

<div class="import-form">
  <Fieldset label={$_('file')} boxed>
    <div class="file-detail">
      <div class="file-name">
        <Truncate>{file.name}</Truncate>
      </div>
      <div class="file-size">({formatBytes(file.size)})</div>
      <Button
        on:click={() => resetFile?.()}
        appearance={'plain'}
        class="padding-zero"
      >
        <Icon {...iconDeleteMajor} />
      </Button>
    </div>
  </Fieldset>

  <Fieldset boxed label={$_('csv_structure')}>
    <LabeledInput label={$_('content_of_first_row')}>
      <Select
        options={[true, false]}
        let:option
        bind:value={$hasHeaderRow}
        on:change={startParse}
      >
        {#if option}
          <span>{$_('column_names')}</span>
        {:else}
          <span>{$_('data_to_be_imported')}</span>
        {/if}
      </Select>
    </LabeledInput>
  </Fieldset>

  {#if isParsing || !parseResult}
    <Spinner />
  {:else if parseResult.status === 'success'}
    <FieldMapping
      fields={parseResult.fields}
      {availableTableColumns}
      mapping={$mapping}
      setMapping={(m) => mapping.set(m)}
    />
  {:else if parseResult.status === 'failure'}
    <ErrorBox>
      {parseResult.message}
    </ErrorBox>
  {:else}
    {assertExhaustive(parseResult)}
  {/if}
</div>

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
  .import-form {
    display: grid;
    gap: 1rem;
  }
  .file-detail {
    display: flex;
    align-items: center;
    gap: var(--sm4);
  }
  .file-name {
    font-weight: 600;
    max-width: 20rem;
  }
  .file-size {
    font-size: var(--sm1);
    color: var(--color-fg-subtle-2);
  }
</style>
