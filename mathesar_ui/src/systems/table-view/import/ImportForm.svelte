<script lang="ts">
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';

  import {
    Button,
    Fieldset,
    Icon,
    Spinner,
    assertExhaustive,
  } from '@mathesar/component-library';
  import LabeledInput from '@mathesar/component-library/labeled-input/LabeledInput.svelte';
  import Select from '@mathesar/component-library/select/Select.svelte';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import { iconDeleteMajor } from '@mathesar/icons';
  import type { ProcessedColumns } from '@mathesar/stores/table-data';
  import { formatBytes } from '@mathesar/utils/unitUtils';

  import FieldMapping from './FieldMapping.svelte';
  import { type CsvPreviewResult, parseCsvPreview } from './importUtils';

  export let file: File;
  export let tableColumns: ProcessedColumns;
  export let resetFile: (() => void) | undefined = undefined;

  let hasHeaderRow = true;
  let parseResult: CsvPreviewResult | undefined;
  let isParsing = false;

  async function parse() {
    isParsing = true;
    parseResult = await parseCsvPreview(file, { hasHeaderRow });
    isParsing = false;
  }

  function startParse() {
    void parse();
  }

  onMount(startParse);
</script>

<div class="import-form">
  <Fieldset label={$_('file')} boxed>
    <div class="file-detail">
      <div class="file-name">{file.name}</div>
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
        bind:value={hasHeaderRow}
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
    <FieldMapping fields={parseResult.fields} {tableColumns} />
  {:else if parseResult.status === 'failure'}
    <ErrorBox>
      {parseResult.message}
    </ErrorBox>
  {:else}
    {assertExhaustive(parseResult)}
  {/if}
</div>

<style>
  .import-form {
    display: grid;
    gap: 1rem;
  }
  .file-detail {
    display: grid;
    grid-auto-flow: column;
    justify-content: start;
    align-items: center;
    gap: var(--sm4);
  }
  .file-name {
    font-weight: 600;
  }
  .file-size {
    font-size: var(--sm1);
    color: var(--color-fg-subtle-2);
  }
</style>
