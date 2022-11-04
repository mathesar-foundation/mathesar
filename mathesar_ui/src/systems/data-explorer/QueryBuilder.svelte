<script lang="ts">
  import {
    Icon,
    InputGroup,
    Button,
    SpinnerButton,
  } from '@mathesar-component-library';
  import EditableTitle from '@mathesar/components/EditableTitle.svelte';
  import SelectTableWithinCurrentSchema from '@mathesar/components/SelectTableWithinCurrentSchema.svelte';
  import SaveStatusIndicator from '@mathesar/components/SaveStatusIndicator.svelte';
  import NameAndDescInputModalForm from '@mathesar/components/NameAndDescInputModalForm.svelte';
  import TableName from '@mathesar/components/TableName.svelte';
  import { tables as tablesDataStore } from '@mathesar/stores/tables';
  import type { TableEntry } from '@mathesar/api/tables';
  import { queries } from '@mathesar/stores/queries';
  import { getAvailableName } from '@mathesar/utils/db';
  import { iconRedo, iconUndo } from '@mathesar/icons';
  import { modal } from '@mathesar/stores/modal';
  import { toast } from '@mathesar/stores/toast';
  import type QueryManager from './QueryManager';
  import type { ColumnWithLink } from './utils';
  import ColumnSelectionPane from './column-selection-pane/ColumnSelectionPane.svelte';
  import ResultPane from './result-pane/ResultPane.svelte';
  import OutputConfigSidebar from './output-config-sidebar/OutputConfigSidebar.svelte';

  const saveModalController = modal.spawnModalController();

  export let queryManager: QueryManager;

  $: ({ query, state } = queryManager);

  $: currentTable = $query.base_table
    ? $tablesDataStore.data.get($query.base_table)
    : undefined;
  $: isSaved = $query.isSaved();

  function updateBaseTable(tableEntry: TableEntry | undefined) {
    void queryManager.update((q) =>
      q.withBaseTable(tableEntry ? tableEntry.id : undefined),
    );
    queryManager.clearSelectedColumn();
  }

  async function addColumn(column: ColumnWithLink) {
    const baseAlias = `${column.tableName}_${column.name}`;
    const allAliases = new Set($query.initial_columns.map((c) => c.alias));
    const alias = getAvailableName(baseAlias, allAliases);
    await queryManager.update((q) =>
      q.withColumn({
        alias,
        id: column.id,
        jp_path: column.jpPath,
        display_name: alias,
      }),
    );
    queryManager.selectColumn(alias);
  }

  function handleNameChange(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.value.trim() === '') {
      target.value = getAvailableName(
        'New_Exploration',
        new Set([...$queries.data.values()].map((q) => q.name)),
      );
    }
    void queryManager.update((q) => q.withName(target.value));
  }

  function getNameValidationErrors(name: string) {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return ['Name cannot be empty.'];
    }
    const isDuplicate = Array.from($queries.data ?? []).some(
      ([, s]) => s.name.toLowerCase().trim() === trimmedName,
    );
    if (isDuplicate) {
      return ['An exploration with that name already exists.'];
    }
    return [];
  }

  async function save() {
    try {
      await queryManager.save();
    } catch (err) {
      toast.fromError(err);
    }
  }

  // TODO: Handle description
  async function create(name: string) {
    try {
      await queryManager.update((q) => q.withName(name));
      await save();
    } catch (err) {
      toast.fromError(err);
    }
  }

  async function saveExistingOrCreateNew() {
    if ($query.isSaved()) {
      await save();
    } else {
      saveModalController.open();
    }
  }
</script>

<div class="data-explorer">
  <div class="header">
    <div class="title-wrapper">
      {#if isSaved}
        <EditableTitle
          value={$query.name}
          size={1.266}
          on:change={handleNameChange}
        />
      {/if}

      <div class="title">Exploring from</div>
      <div class="base-table-holder">
        {#if currentTable}
          <TableName table={currentTable} />
        {:else}
          <SelectTableWithinCurrentSchema
            autoSelect="none"
            table={currentTable}
            on:change={(e) => updateBaseTable(e.detail)}
          />
        {/if}
      </div>
    </div>

    {#if !isSaved && currentTable}
      <Button
        appearance="secondary"
        on:click={() => updateBaseTable(undefined)}
      >
        Start Over
      </Button>
    {/if}

    <div class="actions">
      {#if $query.isSaved()}
        <SaveStatusIndicator status={$state.saveState?.state} />
      {/if}
      <!-- TODO: Change disabled condition to is_valid(query) -->
      <SpinnerButton
        label="Save"
        disabled={!$query.base_table}
        onClick={saveExistingOrCreateNew}
      />
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
    </div>
  </div>
  <div class="content-pane">
    {#if !$query.base_table}
      <div class="help-text">Please select a table to start exploring</div>
    {:else}
      <div class="input-sidebar">
        <ColumnSelectionPane
          {queryManager}
          on:add={(e) => addColumn(e.detail)}
        />
      </div>
      <!-- Do not use inputColumnManager in ResultPane because
        we'd also use ResultPane for query page where input column
        details would not be available-->
      <ResultPane queryRunner={queryManager} />
      <OutputConfigSidebar {queryManager} />
    {/if}
  </div>
</div>

<NameAndDescInputModalForm
  controller={saveModalController}
  save={create}
  {getNameValidationErrors}
  getInitialName={() => $query.name ?? ''}
  getInitialDescription={() => ''}
>
  <span slot="title"> Save Exploration </span>
</NameAndDescInputModalForm>

<style lang="scss">
  .data-explorer {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;

    .header {
      display: flex;
      align-items: center;
      height: var(--table-title-header-height);
      border-bottom: 1px solid var(--slate-300);
      position: relative;
      overflow: hidden;

      .title-wrapper {
        display: flex;
        align-items: center;
        overflow: hidden;
        padding: 1rem;
        font-size: var(--text-size-large);

        .base-table-holder {
          flex-grow: 0;
          flex-shrink: 0;
          margin-left: 1rem;

          > :global(.select) {
            min-width: 14rem;
          }
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
      top: var(--table-title-header-height);
      bottom: 0;
      left: 0;
      right: 0;
      overflow-x: auto;

      .help-text {
        padding: 1rem;
      }

      .input-sidebar {
        width: 20rem;
        border-right: 1px solid var(--color-gray-medium);
        flex-shrink: 0;
        flex-grow: 0;
        flex-basis: 20rem;
        display: flex;
        flex-direction: column;
      }
    }
  }
</style>
