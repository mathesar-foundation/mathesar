<script lang="ts">
  import { type Writable, get } from 'svelte/store';
  import { _ } from 'svelte-i18n';

  import { api } from '@mathesar/api/rpc';
  import type {
    RecordsSummaryListResponse,
    SummarizedRecordReference,
  } from '@mathesar/api/rpc/_common/commonTypes';
  import type { ResultValue } from '@mathesar/api/rpc/records';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import { MiniPagination } from '@mathesar/components/mini-pagination';
  import { RpcError } from '@mathesar/packages/json-rpc-client-builder';
  import { toast } from '@mathesar/stores/toast';
  import { getErrorMessage } from '@mathesar/utils/errors';
  import { Spinner } from '@mathesar-component-library';

  import type MultiTaggerController from './MultiTaggerController';
  import type { MultiTaggerOption } from './MultiTaggerOption';
  import MultiTaggerRow from './MultiTaggerRow.svelte';
  import MultiTaggerSearch from './MultiTaggerSearch.svelte';
  import { buildOptions } from './multiTaggerUtils';


  export let controller: MultiTaggerController;
  export let close: () => void;

  $: ({ elementId, records, searchValue, pagination } = controller);
  $: resolvedRecords = $records.resolvedValue;
  $: recordsCount = resolvedRecords?.count ?? 0;
  $: hasPagination = recordsCount > $pagination.size;

  let options: Writable<MultiTaggerOption>[] = [];
  let selectedIndex: number | undefined;

  function rebuildOptions(response: RecordsSummaryListResponse | undefined) {
    options = [...buildOptions(response)];
    selectedIndex = undefined;
  }

  $: rebuildOptions($records.resolvedValue);

  function getJoinTableOid(): number {
    const joinTableOid = $records.resolvedValue?.mapping?.join_table;
    if (joinTableOid === undefined) {
      throw new Error('Join table OID is undefined');
    }
    return joinTableOid;
  }

  async function addMapping(
    recordKey: SummarizedRecordReference['key'],
  ): Promise<ResultValue> {
    const { database, intermediateTable, currentRecordPk } = controller.props;
    const targetFkAttnum = String(intermediateTable.attnumOfFkToTargetTable);
    const currentFkAttnum = String(intermediateTable.attnumOfFkToCurrentTable);
    const response = await api.records
      .add({
        database_id: database.id,
        table_oid: getJoinTableOid(),
        record_def: {
          [targetFkAttnum]: recordKey,
          [currentFkAttnum]: currentRecordPk,
        },
      })
      .run();
    const resultRow = response.results[0];
    const pkAttnum = Object.keys(resultRow).find(
      ([attnum]) => ![targetFkAttnum, currentFkAttnum].includes(attnum),
    );
    if (!pkAttnum) {
      throw new Error('Unable to determine PK attnum');
    }
    return resultRow[pkAttnum];
  }

  async function removeMapping(mappingId: ResultValue) {
    await api.records
      .delete({
        database_id: controller.props.database.id,
        table_oid: getJoinTableOid(),
        record_ids: [mappingId],
      })
      .run();
  }

  async function toggle(index: number) {
    const option = options.at(index);
    if (!option) return;
    option.update((o) => o.asLoading());
    const { key, mappingId } = get(option);
    try {
      if (mappingId === undefined) {
        const newMappingId = await addMapping(key);
        option.update((o) => o.withMapping(newMappingId));
      } else {
        await removeMapping(mappingId);
        option.update((o) => o.withoutMapping());
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
    option.update((o) => o.asNotLoading());
  }

  function selectIndex(i: number) {
    selectedIndex = i;
  }

  function selectNext() {
    if (selectedIndex === undefined) {
      selectedIndex = 0;
      return;
    }
    selectedIndex = Math.min(selectedIndex + 1, options.length - 1);
  }

  function selectPrevious() {
    if (selectedIndex === undefined) {
      selectedIndex = 0;
      return;
    }
    selectedIndex = Math.max(selectedIndex - 1, 0);
  }

  function toggleSelected() {
    if (!selectedIndex) return;
    void toggle(selectedIndex);
  }

  function handleKeyDown(e: KeyboardEvent) {
    new Map([
      ['Escape', close],
      ['ArrowUp', selectPrevious],
      ['ArrowDown', selectNext],
      ['Enter', toggleSelected],
    ]).get(e.key)?.();
  }
</script>

<div id={elementId} tabindex="0" data-multi-tagger>
  <div data-multi-tagger-controls>
    <MultiTaggerSearch {controller} onKeyDown={handleKeyDown} />
  </div>

  {#if $records.isInitializing}
    <div class="loading"><Spinner /></div>
  {:else if $records.error}
    <ErrorBox>{RpcError.fromAnything($records.error).message}</ErrorBox>
  {:else}
    <div class="option-container">
      {#each options as option, index}
        <MultiTaggerRow
          {option}
          selected={index === selectedIndex}
          searchValue={$searchValue}
          onToggle={() => {
            void toggle(index);
          }}
          onHover={() => selectIndex(index)}
        />
      {:else}
        <div class="no-results">{$_('no_records_found')}</div>
      {/each}
    </div>
    {#if hasPagination}
      <div class="footer">
        <div class="pagination">
          <MiniPagination
            bind:pagination={$pagination}
            on:change={() => controller.getRecords()}
            recordCount={recordsCount}
          />
        </div>
      </div>
    {/if}
  {/if}
</div>

<style lang="scss">
  div[data-multi-tagger] {
    max-width: min(30rem, 90vw);
    overflow: hidden;
    position: relative;
  }

  [data-multi-tagger-controls] {
    display: flex;
    overflow: hidden;
    gap: 0.1rem;
    border-bottom: 1px solid var(--color-border-raised-2);
    box-shadow: 0 1px 3px
      color-mix(in srgb, var(--color-shadow), transparent 10%);
    background: var(--color-bg-raised-2);
  }

  .loading {
    padding: var(--sm5);
    display: grid;
    align-items: center;
    justify-content: center;
  }

  .no-results {
    color: var(--color-fg-base-muted);
  }
  .footer {
    border-top: 1px solid var(--color-border-section);
    padding: var(--sm6);
    display: flex;
    align-items: center;
    font-size: var(--sm2);
  }
  .pagination {
    margin-left: auto;
  }
</style>
