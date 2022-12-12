<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import {
    SpinnerButton,
    TextArea,
    LabeledInput,
    Button,
  } from '@mathesar/component-library';
  import { postAPI } from '@mathesar/api/utils/requestUtils';
  import type { UploadEvents } from './uploadUtils';

  const dispatch = createEventDispatcher<UploadEvents>();
  export let isLoading: boolean;
  export let showCancelButton: boolean;
  export let hideAllActions = false;

  let clipboardContent = '';

  async function importFromText() {
    try {
      dispatch('start');
      const response = await postAPI<{ id: number }>('/api/db/v0/data_files/', {
        paste: clipboardContent,
      });
      dispatch('success', { dataFileId: response.id });
    } catch (err) {
      dispatch('error', err instanceof Error ? err.message : undefined);
    }
  }
</script>

<LabeledInput label="Paste the data you want to import" layout="stacked">
  <TextArea bind:value={clipboardContent} rows={10} disabled={isLoading} />
</LabeledInput>
<div class="help-content">
  The data must be in tabular format (CSV, TSV etc.)
</div>

<slot />

{#if !hideAllActions}
  <div class="buttons">
    {#if showCancelButton}
      <Button appearance="secondary" on:click={() => dispatch('cancel')}>
        Cancel
      </Button>
    {/if}
    <SpinnerButton
      onClick={importFromText}
      label="Continue"
      disabled={!clipboardContent || isLoading}
      class="continue-action"
    />
  </div>
{/if}
