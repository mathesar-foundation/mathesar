<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';

  import type { RecordSummaryListResult } from '@mathesar/api/rpc/records';
  import Tooltip from '@mathesar/component-library/tooltip/Tooltip.svelte';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import { MiniPagination } from '@mathesar/components/mini-pagination';
  import TableName from '@mathesar/components/TableName.svelte';
  import {
    Icon,
    ListBox,
    ListBoxOptions,
    Spinner,
    iconSettings,
  } from '@mathesar-component-library';
  import type { ListBoxApi } from '@mathesar-component-library/types';

  import type RowSeekerController from './RowSeekerController';
  import RowSeekerFilterDrilldown from './RowSeekerFilterDrilldown.svelte';
  import RowSeekerOption from './RowSeekerOption.svelte';
  import RowSeekerSearch from './RowSeekerSearch.svelte';

  const dispatch = createEventDispatcher<{ escape: never }>();

  export let selectedRecord:
    | {
        summary: string;
        pk: string | number | boolean | null;
      }
    | undefined = undefined;

  export let controller: RowSeekerController;

  $: ({ elementId, records, columns, pagination, tableWithMetadata, mode } =
    controller);
  $: isLoading = $records.isLoading || $columns.isLoading;
  $: resolvedRecords = $records.resolvedValue;
  $: linkedRecordSummaries = resolvedRecords?.linked_record_summaries ?? {};
  $: recordsArray = resolvedRecords?.results ?? [];
  $: recordsCount = resolvedRecords?.count ?? 0;
  $: columnsArray = $columns.resolvedValue ?? [];
  $: primaryKeyColumn = columnsArray.find((c) => c.primary_key);
  $: selectedValue =
    selectedRecord && primaryKeyColumn
      ? {
          summary: selectedRecord.summary,
          values: {
            [primaryKeyColumn.id]: selectedRecord.pk,
          },
        }
      : undefined;
  $: hasPagination = recordsCount > $pagination.size;
  $: tableName = $tableWithMetadata.resolvedValue?.name ?? '';

  function checkEquality(
    opt1?: RecordSummaryListResult,
    opt2?: RecordSummaryListResult,
  ) {
    if (primaryKeyColumn) {
      return (
        opt1?.values[primaryKeyColumn.id] === opt2?.values[primaryKeyColumn.id]
      );
    }
    return false;
  }

  function selectRecord(val: RecordSummaryListResult[]) {
    const res = val[0];
    if (res) {
      controller.select({
        recordSummary: res.summary,
        record: res.values,
        recordPk: primaryKeyColumn
          ? String(res.values[primaryKeyColumn.id])
          : undefined,
      });
    }
  }

  function handleKeyDown(
    api: ListBoxApi<RecordSummaryListResult>,
    e: KeyboardEvent,
  ) {
    api.handleKeyDown(e);
    if (e.key === 'Escape') {
      dispatch('escape');
    }
  }

  function getTypeCastedOption(opt: unknown): RecordSummaryListResult {
    return opt as RecordSummaryListResult;
  }
</script>

<div id={elementId} tabindex="0" data-row-seeker>
  <ListBox
    selectionType="single"
    mode="static"
    value={selectedValue ? [selectedValue] : undefined}
    options={recordsArray}
    on:change={(e) => selectRecord(e.detail)}
    on:pick={() => dispatch('escape')}
    {checkEquality}
    let:api
  >
    <div data-row-seeker-controls>
      <RowSeekerSearch
        {controller}
        {columnsArray}
        {linkedRecordSummaries}
        on:artificialKeydown={(e) => handleKeyDown(api, e.detail)}
      />
      <div class="actions">
        {#if isLoading}
          <div class="spinner">
            <Spinner />
          </div>
        {/if}

        {#if $mode === 'complete'}
          <RowSeekerFilterDrilldown {columnsArray} {controller} />
        {/if}
      </div>
    </div>

    <div class="option-container">
      {#if recordsArray.length > 0 && columnsArray.length > 0}
        <ListBoxOptions
          class="option-list-box"
          let:option
          let:isSelected
          let:inFocus
        >
          {@const result = getTypeCastedOption(option)}
          <RowSeekerOption
            {controller}
            {isSelected}
            {inFocus}
            {result}
            columns={columnsArray}
            {linkedRecordSummaries}
          />
        </ListBoxOptions>
      {:else}
        <div class="empty-states">
          {#if isLoading}
            {$_('loading')}
          {:else if $records.error}
            <ErrorBox>
              {$records.error.message}
            </ErrorBox>
          {:else}
            {$_('no_records_found')}
          {/if}
        </div>
      {/if}
    </div>

    <div class="footer">
      {#if hasPagination}
        <div class="pagination">
          <MiniPagination
            bind:pagination={$pagination}
            on:change={() => controller.getRecords()}
            recordCount={recordsCount}
          />
        </div>
      {/if}
      <div class="settings">
        <span class="table-name">
          <TableName table={{ name: tableName }} />
        </span>
        {#if $mode === 'complete'}
          <Tooltip>
            <svelte:fragment slot="trigger">
              <Icon {...iconSettings} />
            </svelte:fragment>
            <svelte:fragment slot="content">
              <span>{$_('Configure Record summary and Lookup columns')}</span>
            </svelte:fragment>
          </Tooltip>
        {/if}
      </div>
    </div>
  </ListBox>
</div>

<style lang="scss">
  div[data-row-seeker] {
    min-width: 20rem;
    max-width: 45rem;
    overflow: hidden;
    position: relative;
  }

  [data-row-seeker-controls] {
    display: flex;
    overflow: hidden;
    gap: 0.1rem;
    border-bottom: 1px solid var(--border-color);
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.05),
      0 1px 3px rgba(0, 0, 0, 0.1),
      0 1px 2px -1px rgba(0, 0, 0, 0.1);
    background: var(--input-background);

    .actions {
      margin-left: auto;
      display: flex;
      align-items: flex-start;
      padding: var(--sm2) 0;
      padding-bottom: var(--sm4);
      flex-shrink: 0;
    }

    .spinner {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 1.2rem;
    }
  }

  .empty-states {
    padding: var(--sm4) var(--sm2);
    max-height: 20rem;
  }

  .option-container {
    overflow-x: hidden;
    overflow-y: auto;
    --list-box-options-padding: 0;

    :global(.option-list-box) {
      max-height: 25rem;
      overflow-y: auto;
    }
  }

  .footer {
    border-top: 1px solid var(--border-color);
    padding: var(--sm6);
    display: flex;
    align-items: center;

    .pagination {
      font-size: var(--sm2);
    }

    .settings {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-direction: row;
      gap: var(--sm4);
      margin-left: auto;

      .table-name {
        font-size: var(--sm2);
        max-width: 7rem;
        padding: var(--sm6) var(--sm5);
        border-radius: var(--sm5);
        cursor: pointer;
      }

      :global(svg) {
        cursor: pointer;
      }
    }
  }
</style>
