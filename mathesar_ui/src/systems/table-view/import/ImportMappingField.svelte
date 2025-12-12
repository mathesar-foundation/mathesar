<script lang="ts">
  import { _ } from 'svelte-i18n';

  import SelectProcessedColumn from '@mathesar/components/SelectProcessedColumn.svelte';
  import { iconChangeAToB } from '@mathesar/icons';
  import type {
    ProcessedColumn,
    ProcessedColumns,
  } from '@mathesar/stores/table-data';
  import { Icon, LabelController, Truncate } from '@mathesar-component-library';

  import type { CsvPreviewField } from './importUtils';

  const labelController = new LabelController();

  export let field: CsvPreviewField;
  export let availableTableColumns: ProcessedColumns;
  export let mappedColumn: ProcessedColumn | undefined = undefined;
  export let onUpdate: ((v: ProcessedColumn | undefined) => void) | undefined =
    undefined;
</script>

<div class="column-name">
  {#if field.name}
    <Truncate>{field.name}</Truncate>
  {:else}
    {$_('column_number', { values: { column_number: field.index + 1 } })}
  {/if}
</div>

<div class="sample-value">
  <Truncate>{field.sampleValue}</Truncate>
</div>

<div class="arrow">
  <Icon {...iconChangeAToB} />
</div>

<div class="destination">
  <SelectProcessedColumn
    value={mappedColumn}
    columns={[...availableTableColumns.values()]}
    allowEmpty
    {labelController}
    {onUpdate}
  >
    <span slot="empty" class="do-not-import">
      {$_('None')}
    </span>
  </SelectProcessedColumn>
</div>

<style>
  .sample-value {
    color: var(--color-fg-subtle-2);
    font-size: var(--sm1);
  }
  .arrow {
    color: var(--color-fg-subtle-2);
  }

  .do-not-import {
    color: var(--color-fg-subtle-2);
    font-style: italic;
  }
</style>
