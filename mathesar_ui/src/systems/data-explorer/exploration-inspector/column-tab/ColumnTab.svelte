<script lang="ts">
  import { onDestroy } from 'svelte';
  import { _ } from 'svelte-i18n';

  import {
    Collapsible,
    LabeledInput,
    TextInput,
  } from '@mathesar-component-library';

  import QueryManager from '../../QueryManager';
  import type QueryRunner from '../../QueryRunner';

  import ColumnSource from './ColumnSource.svelte';
  import DeleteColumnAction from './DeleteColumnAction.svelte';

  export let queryHandler: QueryRunner | QueryManager;

  $: queryManager =
    queryHandler instanceof QueryManager ? queryHandler : undefined;
  $: ({ selection, columnsMetaData, processedColumns } = queryHandler);
  $: ({ selectedCells, columnsSelectedWhenTheTableIsEmpty } = selection);
  $: selectedColumns = (() => {
    const ids = selection.getSelectedUniqueColumnsId(
      $selectedCells,
      $columnsSelectedWhenTheTableIsEmpty,
    );
    const columns = [];
    for (const id of ids) {
      const c = $processedColumns.get(id);
      if (c !== undefined) {
        columns.push(c);
      }
    }
    return columns;
  })();
  $: hasMultipleSelectedColumns = selectedColumns.length > 1;
  $: selectedColumn =
    selectedColumns.length > 0 ? selectedColumns[0] : undefined;
  $: columnInformation = selectedColumn
    ? $columnsMetaData.get(selectedColumn.column.alias)
    : undefined;

  let timer: number;

  onDestroy(() => {
    window.clearTimeout(timer);
  });

  function updateName(value: string) {
    window.clearTimeout(timer);
    if (
      queryManager &&
      selectedColumn &&
      value !== selectedColumn.column.display_name
    ) {
      const { alias } = selectedColumn.column;
      void queryManager.update((q) => q.withDisplayNameForColumn(alias, value));
    }
  }

  function onNameChange(e: Event) {
    const element = e.target as HTMLInputElement;
    updateName(element.value);
  }

  function onNameInput(e: Event) {
    window.clearTimeout(timer);
    const element = e.target as HTMLInputElement;
    timer = window.setTimeout(() => {
      updateName(element.value);
    }, 500);
  }
</script>

{#if hasMultipleSelectedColumns}
  <div class="section-content">
    {$_('multiple_columns_selected', {
      values: { count: selectedColumns.length },
    })}
  </div>
{:else if selectedColumn}
  <Collapsible isOpen triggerAppearance="plain">
    <span slot="header">{$_('properties')}</span>
    <div slot="content" class="section-content">
      <LabeledInput label={$_('name')} layout="stacked">
        <TextInput
          value={selectedColumn.column.display_name}
          on:input={onNameInput}
          on:change={onNameChange}
          disabled={!queryManager}
        />
      </LabeledInput>
      {#if columnInformation}
        <ColumnSource {columnInformation} columnsMetaData={$columnsMetaData} />
      {/if}
    </div>
  </Collapsible>
{/if}

{#if selectedColumns.length > 0 && queryManager}
  <DeleteColumnAction {selectedColumns} {queryManager} />
{/if}

{#if !selectedColumn}
  <div class="section-content">{$_('select_columns_view_properties')}</div>
{/if}
