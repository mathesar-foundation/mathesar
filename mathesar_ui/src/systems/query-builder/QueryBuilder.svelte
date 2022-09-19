<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import {
    Icon,
    LabeledInput,
    InputGroup,
    Button,
  } from '@mathesar-component-library';
  import EditableTitle from '@mathesar/components/EditableTitle.svelte';
  import SelectTableWithinCurrentSchema from '@mathesar/components/SelectTableWithinCurrentSchema.svelte';
  import SaveStatusIndicator from '@mathesar/components/SaveStatusIndicator.svelte';
  import { tables as tablesDataStore } from '@mathesar/stores/tables';
  import type { TableEntry } from '@mathesar/api/tables';
  import { queries } from '@mathesar/stores/queries';
  import { getAvailableName } from '@mathesar/utils/db';
  import { iconExploration, iconRedo, iconUndo } from '@mathesar/icons';
  import type QueryManager from './QueryManager';
  import type { ColumnWithLink } from './utils';
  import ColumnSelectionPane from './column-selection-pane/ColumnSelectionPane.svelte';
  import ResultPane from './result-pane/ResultPane.svelte';
  import OutputConfigSidebar from './output-config-sidebar/OutputConfigSidebar.svelte';

  const dispatch = createEventDispatcher();

  export let queryManager: QueryManager;

  $: ({ query, state } = queryManager);

  $: currentTable = $query.base_table
    ? $tablesDataStore.data.get($query.base_table)
    : undefined;

  function onBaseTableChange(tableEntry: TableEntry | undefined) {
    void queryManager.update((q) =>
      q.withBaseTable(tableEntry ? tableEntry.id : undefined),
    );
    queryManager.clearSelectedColumn();
  }

  function addColumn(column: ColumnWithLink) {
    const baseAlias = `${column.tableName}_${column.name}`;
    const allAliases = new Set($query.initial_columns.map((c) => c.alias));
    const alias = getAvailableName(baseAlias, allAliases);
    void queryManager.update((q) =>
      q.withColumn({
        alias,
        id: column.id,
        jp_path: column.jpPath,
        display_name: alias,
      }),
    );
    queryManager.selectColumn(alias);
  }

  function handleQueryNameChange(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.value.trim() === '') {
      target.value = getAvailableName(
        'New_Exploration',
        new Set([...$queries.data.values()].map((q) => q.name)),
      );
    }
    void queryManager.update((q) => q.withName(target.value));
  }
</script>

<div class="query-builder">
  <div class="header">
    <div class="title-wrapper">
      <div class="icon">
        <Icon {...iconExploration} size="1.5em" />
      </div>

      <EditableTitle
        value={$query.name}
        size={1.266}
        on:change={handleQueryNameChange}
      />
    </div>

    <SaveStatusIndicator status={$state.saveState?.state} />
    <div class="actions">
      <InputGroup>
        <Button
          appearance="default"
          disabled={!$state.isUndoPossible}
          on:click={() => queryManager.undo()}
        >
          <Icon {...iconUndo} />
          <span>Undo</span>
        </Button>
        <Button
          appearance="default"
          disabled={!$state.isRedoPossible}
          on:click={() => queryManager.redo()}
        >
          <Icon {...iconRedo} />
          <span>Redo</span>
        </Button>
      </InputGroup>
      <Button appearance="default" on:click={() => dispatch('close')}
        >Close</Button
      >
    </div>
  </div>
  <div class="content-pane">
    <div class="input-sidebar">
      <div class="base-table-selector">
        <LabeledInput label="Select Base Table" layout="stacked">
          <SelectTableWithinCurrentSchema
            autoSelect="none"
            table={currentTable}
            on:change={(e) => onBaseTableChange(e.detail)}
          />
        </LabeledInput>
      </div>
      <ColumnSelectionPane {queryManager} on:add={(e) => addColumn(e.detail)} />
    </div>
    <!-- Do not use inputColumnManager in ResultPane because
      we'd also use ResultPane for query page where input column
      details would not be available-->
    <ResultPane {queryManager} />
    <OutputConfigSidebar {queryManager} />
  </div>
</div>

<style lang="scss">
  .query-builder {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;

    .header {
      display: flex;
      align-items: center;
      height: 4rem;
      border-bottom: 1px solid var(--color-gray-dark);
      position: relative;
      overflow: hidden;

      .title-wrapper {
        display: flex;
        align-items: center;
        overflow: hidden;
        padding: 0.7rem 1rem;
        margin-right: 1rem;
        border-right: 1px solid var(--color-gray-medium);
      }

      .icon {
        margin-right: 0.25rem;
        opacity: 0.8;
        :global(svg.fa-icon) {
          color: var(--color-gray-darker);
        }
      }

      .actions {
        flex-shrink: 0;
        padding: 0.5rem;
        margin-left: auto;
        display: flex;
        align-items: center;
        gap: 1rem;
        :global(button) {
          flex-shrink: 0;
        }
        :global(button .fa-icon) {
          padding-right: 0.25rem;
        }
      }
    }
    .content-pane {
      display: flex;
      position: absolute;
      top: 4rem;
      bottom: 0;
      left: 0;
      right: 0;
      overflow-x: auto;

      .input-sidebar {
        width: 20rem;
        border-right: 1px solid var(--color-gray-medium);
        flex-shrink: 0;
        flex-grow: 0;
        flex-basis: 20rem;
        display: flex;
        flex-direction: column;

        .base-table-selector {
          border-bottom: 1px solid var(--color-gray-medium);
          padding: 1rem;
          background: var(--color-gray-light);
          flex-grow: 0;
          flex-shrink: 0;
          :global(label) {
            font-weight: 500;
          }
        }
      }
    }
  }
</style>
