<script lang="ts">
  import { getErrorMessage } from '@mathesar/utils/errors';
  import { toast } from '@mathesar/stores/toast';
  import {
    Checkbox,
    MatchHighlighter,
    Truncate,
    LabeledInput,
  } from '@mathesar-component-library';
  import { api } from '@mathesar/api/rpc';
  import type MultiTaggerController from './MultiTaggerController';
  import type { SummarizedRecordReference } from '@mathesar/api/rpc/_common/commonTypes';

  export let controller: MultiTaggerController;
  export let record: SummarizedRecordReference;

  $: ({ props: controllerProps, searchValue, records } = controller);
  $: ({ database, intermediateTable, currentRecordPk } = controllerProps);
  $: ({ key, summary } = record);
  $: joinTableOid = $records.resolvedValue?.mapping?.join_table;
  $: joinedValues = $records.resolvedValue?.mapping?.joined_values ?? {};
  $: joinValue = joinedValues[String(key)];

  let checked = false;
  let changing = false;

  $: if (joinValue !== undefined) {
    checked = true;
  } else {
    checked = false;
  }

  async function addMapping() {
    if (joinTableOid === undefined) {
      throw new Error('Join table OID is undefined');
    }
    await api.records
      .add({
        database_id: database.id,
        table_oid: joinTableOid,
        record_def: {
          [String(intermediateTable.attnumOfFkToTargetTable)]: key,
          [String(intermediateTable.attnumOfFkToCurrentTable)]: currentRecordPk,
        },
      })
      .run();
  }

  async function removeMapping() {
    if (joinTableOid === undefined) {
      throw new Error('Join table OID is undefined');
    }
    if (joinValue === undefined) {
      throw new Error('Join value is undefined');
    }
    await api.records
      .delete({
        database_id: database.id,
        table_oid: joinTableOid,
        record_ids: [joinValue],
      })
      .run();
  }

  async function handleChange() {
    changing = true;
    const action = checked ? addMapping : removeMapping;
    try {
      await action();
    } catch (error) {
      toast.error(getErrorMessage(error));
      checked = !checked;
    }
    changing = false;
  }
</script>

<div class="record" class:changing>
  <LabeledInput layout="inline-input-first">
    <span slot="label">
      <Truncate>
        <MatchHighlighter text={summary} substring={$searchValue} />
      </Truncate>
    </span>
    <Checkbox bind:checked on:change={handleChange} disabled={changing} />
  </LabeledInput>
</div>

<style>
  .record {
    border-bottom: 1px solid var(--border-color);
    padding: var(--sm5) var(--sm3);
  }
  .changing {
    opacity: 0.5;
  }
  .changing :global(*) {
    cursor: pointer;
  }
</style>
