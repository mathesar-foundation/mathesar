<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import {
    Icon,
    LabeledInput,
    InputGroup,
    Button,
  } from '@mathesar-component-library';
  import {
    faFileContract,
    faUndo,
    faRedo,
  } from '@fortawesome/free-solid-svg-icons';
  import EditableTitle from '@mathesar/components/EditableTitle.svelte';
  import SelectTableWithinCurrentSchema from '@mathesar/components/SelectTableWithinCurrentSchema.svelte';
  import SaveStatusIndicator from '@mathesar/components/SaveStatusIndicator.svelte';
  import { tables as tablesDataStore } from '@mathesar/stores/tables';
  import type { TableEntry } from '@mathesar/api/tables/tableList';
  import type QueryManager from './QueryManager';
  import type { QueryInitialColumn } from './QueryModel';
  import ColumnSelectionPane from './column-selection-pane/ColumnSelectionPane.svelte';

  const dispatch = createEventDispatcher();

  export let queryManager: QueryManager;

  const { query, state } = queryManager;

  $: currentTable = $query.base_table
    ? $tablesDataStore.data.get($query.base_table)
    : undefined;

  function onBaseTableChange(tableEntry: TableEntry | undefined) {
    void queryManager.update((q) =>
      q.setBaseTable(tableEntry ? tableEntry.id : undefined),
    );
  }

  function addColumn(column: QueryInitialColumn) {
    void queryManager.update((q) => q.addColumn(column));
  }

  function handleQueryNameChange(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.value.trim() === '') {
      target.value = 'Untitled file';
    }
    void queryManager.update((q) => q.setName(target.value));
  }
</script>

<div class="query-builder">
  <div class="title-bar">
    <div class="icon">
      <Icon data={faFileContract} size="2em" />
    </div>
    <div class="name">
      <EditableTitle
        value={$query.name}
        size={1.3}
        on:change={handleQueryNameChange}
      />
      <SaveStatusIndicator status={$state.saveState?.state} />
    </div>
    <div class="toolbar">
      <InputGroup>
        <Button
          appearance="plain"
          disabled={!$state.isUndoPossible}
          on:click={() => queryManager.undo()}
        >
          <Icon data={faUndo} />
          <span>Undo</span>
        </Button>
        <Button
          appearance="plain"
          disabled={!$state.isRedoPossible}
          on:click={() => queryManager.redo()}
        >
          <Icon data={faRedo} />
          <span>Redo</span>
        </Button>
        <Button appearance="plain">View SQL</Button>
        <Button appearance="plain" on:click={() => dispatch('close')}
          >Close</Button
        >
      </InputGroup>
    </div>
  </div>
  <div class="content-pane">
    <div class="input-sidebar">
      <div>
        <LabeledInput label="Select Base Table" layout="stacked">
          <SelectTableWithinCurrentSchema
            prependBlank
            table={currentTable}
            on:change={(e) => onBaseTableChange(e.detail)}
          />
        </LabeledInput>
      </div>
      <ColumnSelectionPane
        baseTable={currentTable}
        on:add={(e) => addColumn(e.detail)}
      />
    </div>
    <div class="result">
      {#each $query.initial_columns as column (column.alias)}
        Column: {column.column}:{column.alias}
      {/each}
    </div>
    <div class="output-config-sidebar" />
  </div>
</div>

<style lang="scss">
  .query-builder {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;

    .title-bar {
      display: flex;
      height: 3.5rem;
      align-items: center;
      border-bottom: 1px solid #efefef;
      position: relative;
      overflow: hidden;

      .icon {
        padding: 0 0.3rem 0 1rem;
        flex-shrink: 0;
        flex-grow: 0;

        :global(svg.fa-icon) {
          color: #4285f4;
        }
      }
      .name {
        flex-grow: 1;
        padding-right: 1rem;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;

        :global(.save-status) {
          display: inline-flex;
          flex-shrink: 0;
        }
      }

      .toolbar {
        flex-shrink: 0;
        padding-right: 1rem;
        :global(button) {
          flex-shrink: 0;
        }
        :global(button .fa-icon) {
          padding-right: 0.2rem;
        }
      }
    }
    .content-pane {
      display: flex;
      position: absolute;
      top: 3.5rem;
      bottom: 0;
      left: 0;
      right: 0;

      .input-sidebar {
        width: 22rem;
        border-right: 1px solid #efefef;
        padding: 0.75rem;
        flex-shrink: 0;
        flex-grow: 0;
        flex-basis: 22rem;
      }
      .result {
      }
      .output-config-sidebar {
      }
    }
  }
</style>
