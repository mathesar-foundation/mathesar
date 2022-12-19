<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import {
    SpinnerButton,
    TextInput,
    LabeledInput,
    Button,
  } from '@mathesar/component-library';
  import { postAPI } from '@mathesar/api/utils/requestUtils';
  import type { UploadEvents } from './uploadUtils';

  const dispatch = createEventDispatcher<UploadEvents>();
  export let isLoading: boolean;
  export let showCancelButton: boolean;
  export let hideAllActions = false;

  let url: string;

  async function importFromURL() {
    try {
      dispatch('start');
      const response = await postAPI<{ id: number }>('/api/db/v0/data_files/', {
        url,
      });
      dispatch('success', { dataFileId: response.id });
    } catch (err) {
      dispatch('error', err instanceof Error ? err.message : undefined);
    }
  }
</script>

<LabeledInput
  label="Enter the URL of the file you want to import"
  layout="stacked"
>
  <TextInput bind:value={url} aria-label="URL" disabled={isLoading} />
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
      onClick={importFromURL}
      label="Continue"
      disabled={!url || isLoading}
      class="continue-action"
    />
  </div>
{/if}
