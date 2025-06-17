<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { _ } from 'svelte-i18n';

  import type { RecordSummaryListResult } from '@mathesar/api/rpc/records';
  import { iconAddFilter } from '@mathesar/icons';
  import {
    Icon,
    ListBox,
    ListBoxOptions,
    Spinner,
  } from '@mathesar-component-library';
  import type { ListBoxApi } from '@mathesar-component-library/types';

  import type RowSeekerController from './RowSeekerController';
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

  $: ({ elementId, records, columns } = controller);
  $: isLoading = $records.isLoading || $columns.isLoading;
  $: resolvedRecords = $records.resolvedValue;
  $: linkedRecordSummaries = resolvedRecords?.linked_record_summaries ?? {};
  $: recordsArray = resolvedRecords?.results ?? [];
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

  onMount(() => {
    //
  });

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
        on:artificialKeydown={(e) => handleKeyDown(api, e.detail)}
      />
      <div class="actions">
        {#if isLoading}
          <div class="spinner">
            <Spinner />
          </div>
        {/if}

        <div class="drilldown">
          <Icon {...iconAddFilter} />
        </div>
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
      {/if}
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

    .actions {
      margin-left: auto;
      display: flex;
      align-items: center;
    }

    .drilldown {
      color: var(--gray-500);
      font-size: var(--sm1);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0 var(--sm3);
    }

    .spinner {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
    }
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
</style>
