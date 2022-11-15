<script lang="ts">
  import {
    Icon,
    InputGroup,
    Button,
    SpinnerButton,
  } from '@mathesar-component-library';
  import { iconRedo, iconUndo, iconInspector } from '@mathesar/icons';
  import type { TableEntry } from '@mathesar/api/tables';
  import { tables as tablesDataStore } from '@mathesar/stores/tables';
  import TableName from '@mathesar/components/TableName.svelte';
  import SelectTableWithinCurrentSchema from '@mathesar/components/SelectTableWithinCurrentSchema.svelte';
  import SaveStatusIndicator from '@mathesar/components/SaveStatusIndicator.svelte';
  import NameAndDescInputModalForm from '@mathesar/components/NameAndDescInputModalForm.svelte';
  import { modal } from '@mathesar/stores/modal';
  import { toast } from '@mathesar/stores/toast';
  import { queries } from '@mathesar/stores/queries';
  import type QueryManager from './QueryManager';
  import type { ColumnWithLink } from './utils';

  const saveModalController = modal.spawnModalController();

  export let queryManager: QueryManager;
  export let linkCollapsibleOpenState: Record<ColumnWithLink['id'], boolean> =
    {};
  export let isInspectorOpen: boolean;

  $: ({ query, state } = queryManager);
  $: currentTable = $query.base_table
    ? $tablesDataStore.data.get($query.base_table)
    : undefined;
  $: isSaved = $query.isSaved();
  $: hasNoColumns = $query.initial_columns.length === 0;

  function updateBaseTable(tableEntry: TableEntry | undefined) {
    void queryManager.update((q) =>
      q.withBaseTable(tableEntry ? tableEntry.id : undefined),
    );
    queryManager.clearSelectedColumn();
    linkCollapsibleOpenState = {};
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

<div class="actions-pane">
  <div class="detail-wrapper">
    <div class="detail">
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

    {#if !isSaved && currentTable}
      <Button
        appearance="secondary"
        on:click={() => updateBaseTable(undefined)}
      >
        Start Over
      </Button>
    {/if}

    {#if $query.isSaved()}
      <SaveStatusIndicator status={$state.saveState?.state} />
    {/if}
  </div>

  {#if currentTable}
    <div class="actions">
      <!-- TODO: Change disabled condition to is_valid(query) -->
      <SpinnerButton
        label="Save"
        disabled={!$query.base_table || hasNoColumns}
        onClick={saveExistingOrCreateNew}
      />
      <InputGroup>
        <Button
          appearance="secondary"
          disabled={!$state.isUndoPossible}
          on:click={() => queryManager.undo()}
        >
          <Icon {...iconUndo} size="0.8rem" />
          <span>Undo</span>
        </Button>
        <Button
          appearance="secondary"
          disabled={!$state.isRedoPossible}
          on:click={() => queryManager.redo()}
        >
          <Icon {...iconRedo} size="0.8rem" />
          <span>Redo</span>
        </Button>
      </InputGroup>
      <Button
        appearance="secondary"
        disabled={hasNoColumns}
        on:click={() => {
          isInspectorOpen = !isInspectorOpen;
        }}
      >
        <Icon {...iconInspector} size="0.8rem" />
        <span>Inspector</span>
      </Button>
    </div>
  {/if}
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
  .actions-pane {
    display: flex;
    align-items: center;
    overflow: hidden;
    height: 4.28575rem;
    flex-grow: 1;

    .detail-wrapper {
      display: inline-flex;
      align-items: center;
      overflow: hidden;
      flex-shrink: 0;

      .detail,
      .base-table-holder {
        font-size: var(--text-size-large);
      }

      .base-table-holder {
        flex-grow: 0;
        flex-shrink: 0;
        margin: 0 var(--size-base);

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
      margin-left: auto;
      display: inline-flex;
      align-items: center;
      gap: var(--size-small);

      :global(button) {
        flex-shrink: 0;
      }
    }
  }
</style>
