<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { getQueryStringFromParams } from '@mathesar/api/rest/utils/requestUtils';
  import EntityPageHeader from '@mathesar/components/EntityPageHeader.svelte';
  import InspectorButton from '@mathesar/components/InspectorButton.svelte';
  import NameAndDescInputModalForm from '@mathesar/components/NameAndDescInputModalForm.svelte';
  import SaveButton from '@mathesar/components/SaveButton.svelte';
  import SelectTableWithinCurrentSchema from '@mathesar/components/SelectTableWithinCurrentSchema.svelte';
  import TableName from '@mathesar/components/TableName.svelte';
  import { iconExploration, iconExport } from '@mathesar/icons';
  import type { Table } from '@mathesar/models/Table';
  import { modal } from '@mathesar/stores/modal';
  import { queries } from '@mathesar/stores/queries';
  import { currentTablesData as tablesDataStore } from '@mathesar/stores/tables';
  import { toast } from '@mathesar/stores/toast';
  import {
    AnchorButton,
    Button,
    Help,
    Icon,
    Tooltip,
  } from '@mathesar-component-library';

  import type QueryManager from '../QueryManager';
  import type { ColumnWithLink } from '../utils';

  const saveModalController = modal.spawnModalController();

  export let queryManager: QueryManager;
  export let linkCollapsibleOpenState: Record<ColumnWithLink['id'], boolean> =
    {};
  export let isInspectorOpen: boolean;

  $: ({ rowsData, query, queryHasUnsavedChanges } = queryManager);
  $: currentTable = $query.base_table_oid
    ? $tablesDataStore.tablesMap.get($query.base_table_oid)
    : undefined;
  $: isSaved = $query.isSaved();
  $: hasColumns = $query.initial_columns.length > 0;
  $: canSave = !!$query.base_table_oid && hasColumns && $queryHasUnsavedChanges;
  $: exportLinkParams = getQueryStringFromParams({
    database_id: $query.database_id,
    exploration_id: $query.id,
  });

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
    --icon-fill-color="linear-gradient(135deg, var(--color-exploration), var(--color-exploration-40))"
    --icon-stroke-color="var(--color-fg-inverted)"
  >
    <div class="detail-wrapper">
      <div class="detail">
        {isSaved ? $_('based_on') : $_('exploring_from')}
      </div>
      <div class="base-table-holder" class:table-selected={currentTable}>
        {#if currentTable}
          <TableName table={currentTable} />
        {:else}
          <span class="select-table">
            <SelectTableWithinCurrentSchema
              autoSelect="none"
              value={currentTable}
              on:change={(e) => updateBaseTable(e.detail)}
            />
          </span>
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
    </div>

    <svelte:fragment slot="actions-right">
      {#if currentTable}
        <SaveButton
          {canSave}
          unsavedChangesText={$_('exploration_has_unsaved_changes')}
          onSave={saveExistingOrCreateNew}
        />

        {#if hasColumns && !canSave}
          <Tooltip allowHover>
            <AnchorButton
              slot="trigger"
              href="/api/export/v0/explorations/?{exportLinkParams}"
              data-tinro-ignore
              appearance="secondary"
              size="medium"
              aria-label={$_('export')}
              download="{$query.name}.csv"
            >
              <Icon {...iconExport} />
              <span class="responsive-button-label">{$_('export')}</span>
            </AnchorButton>
            <span slot="content">
              {$_('export_exploration_as_csv_help', {
                values: { explorationName: $query.name },
              })}
              {#if $rowsData.totalCount > 50000}
                {$_('export_exploration_50K_limit')}
              {/if}
            </span>
          </Tooltip>
        {:else}
          <Tooltip enabled={hasColumns}>
            <Button
              slot="trigger"
              appearance="secondary"
              size="medium"
              aria-label={$_('export')}
              disabled=true
            >
              <Icon {...iconExport} />
              <span class="responsive-button-label">{$_('export')}</span>
            </Button>
            <span slot="content">
                {$_('export_exploration_save_help')}
            </span>
          </Tooltip>
        {/if}

        <InspectorButton
          disabled={!hasColumns}
          active={isInspectorOpen}
          toggle={() => {
            isInspectorOpen = !isInspectorOpen;
          }}
        />
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
      font-size: var(--lg1);
      font-weight: 500;
    }

    .base-table-holder {
      display: flex;
      align-items: center;
      flex-grow: 0;
      flex-shrink: 0;
      margin: 0 var(--sm1);

      > :global(* + *) {
        margin-left: 0.4rem;
      }

      &.table-selected {
        font-weight: 500;
      }

      .select-table {
        min-width: 12rem;
        font-size: 1rem;
      }
    }
  }
</style>
