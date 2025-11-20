<script lang="ts">
  import { getErrorMessage } from '@mathesar/utils/errors';
  import { toast } from '@mathesar/stores/toast';
  import {
    Checkbox,
    MatchHighlighter,
    Truncate,
    LabeledInput,
  } from '@mathesar-component-library';
  import type { ResultValue } from '@mathesar/api/rpc/records';
  import { api } from '@mathesar/api/rpc';

  export let searchValue: string | undefined = undefined;
  export let joinTable: number | undefined = undefined;
  export let joinValue: ResultValue | undefined = undefined;
  export let summary: string;

  let checked = joinValue !== undefined;
  let changing = false;

  async function addMapping() {
    try {
      // await api.records
      //   .add({
      //   })
      //   .run();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  function removeMapping() {
    try {
      api;
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  function handleChange({ detail: checked }: CustomEvent<boolean>) {
    changing = true;
    if (checked) {
      addMapping();
    } else {
      removeMapping();
    }
    changing = false;
  }
</script>

<div class="record">
  <LabeledInput layout="inline-input-first">
    <span slot="label">
      <Truncate>
        <MatchHighlighter text={summary} substring={searchValue} />
      </Truncate>
    </span>
    <Checkbox bind:checked on:change={handleChange} />
  </LabeledInput>
</div>

<style>
  .record {
    border-bottom: 1px solid var(--border-color);
    padding: var(--sm5) var(--sm3);
  }
</style>
