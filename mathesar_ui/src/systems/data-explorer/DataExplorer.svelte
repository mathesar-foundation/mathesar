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
  import InputSidebar from './input-sidebar/InputSidebar.svelte';
  import ResultPane from './result-pane/ResultPane.svelte';
  import OutputConfigSidebar from './output-config-sidebar/OutputConfigSidebar.svelte';
  import type { ColumnWithLink } from './utils';

  const saveModalController = modal.spawnModalController();

  export let queryManager: QueryManager;
  export let linkCollapsibleOpenState: Record<ColumnWithLink['id'], boolean> =
    {};

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
    linkCollapsibleOpenState = {};
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

      <div class="title">
        {isSaved ? 'Based on' : 'Exploring from'}
      </div>
      <div class="base-table-holder" class:table-selected={currentTable}>
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
      {#if currentTable}
        <!-- TODO: Change disabled condition to is_valid(query) -->
        <SpinnerButton
          label="Save"
          disabled={!$query.base_table}
          onClick={saveExistingOrCreateNew}
        />
        <InputGroup>
          <Button
            appearance="secondary"
            disabled={!$state.isUndoPossible}
            on:click={() => queryManager.undo()}
          >
            <Icon {...iconUndo} />
            <span>Undo</span>
          </Button>
          <Button
            appearance="secondary"
            disabled={!$state.isRedoPossible}
            on:click={() => queryManager.redo()}
          >
            <Icon {...iconRedo} />
            <span>Redo</span>
          </Button>
        </InputGroup>
      {/if}
    </div>
  </div>
  <div class="content-pane">
    {#if !$query.base_table}
      <div class="help-text">
        Get started by selecting a table and adding columns
      </div>
    {:else}
      <InputSidebar {queryManager} {linkCollapsibleOpenState} />
      {#if $query.initial_columns.length > 0}
        <ResultPane queryRunner={queryManager} />
        <OutputConfigSidebar {queryManager} />
      {:else}
        <div class="help-text">Get started by adding columns from the left</div>
      {/if}
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
          margin-left: 0.7rem;

          &.table-selected {
            font-weight: 590;
          }

          > :global(.select) {
            min-width: 12rem;
            font-size: var(--text-size-base);
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
      overflow: hidden;

      .help-text {
        display: inline-block;
        margin-top: 10rem;
        margin-left: auto;
        margin-right: auto;
        font-size: var(--text-size-xx-large);
        color: var(--slate-400);
      }
    }
  }
</style>
