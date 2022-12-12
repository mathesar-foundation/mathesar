<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { SpinnerButton, TextArea } from '@mathesar/component-library';
  import { postAPI } from '@mathesar/api/utils/requestUtils';
  import type { UploadEvents } from './uploadUtils';

  const dispatch = createEventDispatcher<UploadEvents>();
  export let isLoading: boolean;

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

<div class="help-content">Paste your data below:</div>

<TextArea bind:value={clipboardContent} rows={10} disabled={isLoading} />

<div class="buttons">
  <SpinnerButton
    onClick={importFromText}
    label="Continue"
    disabled={!clipboardContent || isLoading}
  />
</div>
