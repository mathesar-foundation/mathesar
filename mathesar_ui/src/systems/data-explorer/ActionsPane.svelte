<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import {
    Icon,
    InputGroup,
    Button,
    SpinnerButton,
    DropdownMenu,
    ButtonMenuItem,
    iconExpandDown,
  } from '@mathesar-component-library';
  import { iconRedo, iconUndo, iconInspector } from '@mathesar/icons';
  import type { TableEntry } from '@mathesar/api/types/tables';
  import { tables as tablesDataStore } from '@mathesar/stores/tables';
  import TableName from '@mathesar/components/TableName.svelte';
  import SelectTableWithinCurrentSchema from '@mathesar/components/SelectTableWithinCurrentSchema.svelte';
  import ModificationStatus from '@mathesar/components/ModificationStatus.svelte';
  import NameAndDescInputModalForm from '@mathesar/components/NameAndDescInputModalForm.svelte';
  import { modal } from '@mathesar/stores/modal';
  import { toast } from '@mathesar/stores/toast';
  import { queries } from '@mathesar/stores/queries';
  import type QueryManager from './QueryManager';
  import type { ColumnWithLink } from './utils';

  const dispatch = createEventDispatcher();
  const saveModalController = modal.spawnModalController();

  export let queryManager: QueryManager;
  export let linkCollapsibleOpenState: Record<ColumnWithLink['id'], boolean> =
    {};
  export let isInspectorOpen: boolean;

  $: ({ query, state, queryHasUnsavedChanges } = queryManager);
  $: currentTable = $query.base_table
    ? $tablesDataStore.data.get($query.base_table)
    : undefined;
  $: isSaved = $query.isSaved();
  $: hasNoColumns = $query.initial_columns.length === 0;
  $: querySaveRequestStatus = $state.saveState?.state;

  function updateBaseTable(tableEntry: TableEntry | undefined) {
    void queryManager.update((q) =>
      q.withBaseTable(tableEntry ? tableEntry.id : undefined),
    );
    queryManager.clearSelection();
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
      return { success: true };
    } catch (err) {
      toast.fromError(err);
      return { success: false };
    }
  }

  async function saveAndClose() {
    const { success } = await save();
    if (success) {
      dispatch('close');
    }
  }

  async function create(name: string, description: string) {
    try {
      await queryManager.update((q) =>
        q.withName(name).model.withDescription(description),
      );
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
          value={currentTable}
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

    {#if isSaved}
      <ModificationStatus
        requestState={$state.saveState?.state}
        hasChanges={$queryHasUnsavedChanges}
      />
    {/if}
  </div>

  {#if currentTable}
    <div class="actions">
      <InputGroup>
        <!-- TODO: Change disabled condition to is_valid(query) -->
        <SpinnerButton
          label={querySaveRequestStatus === 'processing' ? 'Saving' : 'Save'}
          disabled={!$query.base_table ||
            hasNoColumns ||
            querySaveRequestStatus === 'processing'}
          onClick={saveExistingOrCreateNew}
        />
        {#if isSaved}
          <DropdownMenu
            triggerAppearance="primary"
            placement="bottom-end"
            closeOnInnerClick={true}
            icon={{
              ...iconExpandDown,
              size: '0.8em',
            }}
            showArrow={false}
          >
            <ButtonMenuItem on:click={save}>Save</ButtonMenuItem>
            <ButtonMenuItem on:click={saveAndClose}>
              Save and Close
            </ButtonMenuItem>
          </DropdownMenu>
        {/if}
      </InputGroup>

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
  getInitialDescription={() => $query.description ?? ''}
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
        font-weight: 500;
      }

      .base-table-holder {
        flex-grow: 0;
        flex-shrink: 0;
        margin: 0 var(--size-base);

        &.table-selected {
          font-weight: 600;
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
