<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { SpinnerButton, TextInput } from '@mathesar/component-library';
  import { postAPI } from '@mathesar/utils/api';
  import type { UploadEvents } from './uploadUtils';

  const dispatch = createEventDispatcher<UploadEvents>();
  export let isLoading: boolean;

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

<div class="help-content">Enter a URL pointing to data to download:</div>

<TextInput bind:value={url} aria-label="URL" disabled={isLoading} />

<div class="buttons">
  <SpinnerButton
    onClick={importFromURL}
    label="Continue"
    disabled={!url || isLoading}
  />
</div>
