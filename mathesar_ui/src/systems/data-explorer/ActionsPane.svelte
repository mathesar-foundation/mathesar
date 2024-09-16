<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';

  import EntityPageHeader from '@mathesar/components/EntityPageHeader.svelte';
  import ModificationStatus from '@mathesar/components/ModificationStatus.svelte';
  import NameAndDescInputModalForm from '@mathesar/components/NameAndDescInputModalForm.svelte';
  import SelectTableWithinCurrentSchema from '@mathesar/components/SelectTableWithinCurrentSchema.svelte';
  import TableName from '@mathesar/components/TableName.svelte';
  import {
    iconExploration,
    iconInspector,
    iconRedo,
    iconUndo,
  } from '@mathesar/icons';
  import type { Table } from '@mathesar/models/Table';
  import { modal } from '@mathesar/stores/modal';
  import { queries } from '@mathesar/stores/queries';
  import { currentTablesData as tablesDataStore } from '@mathesar/stores/tables';
  import { toast } from '@mathesar/stores/toast';
  import {
    Button,
    ButtonMenuItem,
    DropdownMenu,
    Help,
    Icon,
    InputGroup,
    SpinnerButton,
    iconExpandDown,
  } from '@mathesar-component-library';

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
    ? $tablesDataStore.tablesMap.get($query.base_table)
    : undefined;
  $: isSaved = $query.isSaved();
  $: hasNoColumns = $query.initial_columns.length === 0;
  $: querySaveRequestStatus = $state.saveState?.state;

  function updateBaseTable(table: Table | undefined) {
    void queryManager.update((q) =>
      q.withBaseTable(table ? table.oid : undefined),
    );
    linkCollapsibleOpenState = {};
  }

  function getNameValidationErrors(name: string) {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return [$_('exploration_name_cannot_be_empty')];
    }
    const isDuplicate = Array.from($queries.data ?? []).some(
      ([, s]) => s.name.toLowerCase().trim() === trimmedName,
    );
    if (isDuplicate) {
      return [$_('exploration_with_name_already_exists')];
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
  <EntityPageHeader
    title={isSaved
      ? {
          name: $query.name ?? '',
          description: $query.description,
          icon: iconExploration,
        }
      : undefined}
  >
    <div class="detail-wrapper">
      <div class="detail">
        {isSaved ? $_('based_on') : $_('exploring_from')}
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
        <Help>
          {$_('base_table_exploration_help')}
        </Help>
      </div>

      {#if !isSaved && currentTable}
        <Button
          appearance="secondary"
          on:click={() => updateBaseTable(undefined)}
        >
          {$_('start_over')}
        </Button>
      {/if}

      {#if isSaved}
        <ModificationStatus
          requestState={$state.saveState?.state}
          hasChanges={$queryHasUnsavedChanges}
        />
      {/if}
    </div>

    <svelte:fragment slot="actions-right">
      {#if currentTable}
        <InputGroup>
          <!-- TODO: Change disabled condition to is_valid(query) -->
          <SpinnerButton
            label={querySaveRequestStatus === 'processing'
              ? $_('saving')
              : $_('save')}
            disabled={!$query.base_table ||
              hasNoColumns ||
              querySaveRequestStatus === 'processing'}
            onClick={saveExistingOrCreateNew}
          />
          {#if isSaved}
            <DropdownMenu
              triggerAppearance="primary"
              placements={['bottom-end']}
              closeOnInnerClick={true}
              icon={{
                ...iconExpandDown,
                size: '0.8em',
              }}
              showArrow={false}
            >
              <ButtonMenuItem on:click={save}>{$_('save')}</ButtonMenuItem>
              <ButtonMenuItem on:click={saveAndClose}>
                {$_('save_and_close')}
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
            <span>{$_('undo')}</span>
          </Button>
          <Button
            appearance="secondary"
            disabled={!$state.isRedoPossible}
            on:click={() => queryManager.redo()}
          >
            <Icon {...iconRedo} size="0.8rem" />
            <span>{$_('redo')}</span>
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
          <span>{$_('inspector')}</span>
        </Button>
      {/if}
    </svelte:fragment>
  </EntityPageHeader>
</div>

<NameAndDescInputModalForm
  controller={saveModalController}
  save={create}
  {getNameValidationErrors}
  getInitialName={() => $query.name ?? ''}
  getInitialDescription={() => $query.description ?? ''}
>
  <span slot="title"> {$_('save_exploration')} </span>
</NameAndDescInputModalForm>

<style lang="scss">
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
      display: flex;
      align-items: center;
      flex-grow: 0;
      flex-shrink: 0;
      margin: 0 var(--size-small);

      > :global(* + *) {
        margin-left: 0.4rem;
      }

      &.table-selected {
        font-weight: 500;
      }

      > :global(.select) {
        min-width: 12rem;
        font-size: var(--text-size-base);
      }
    }
  }
</style>
