<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { SpinnerButton, TextInput } from '@mathesar/component-library';
  import { postAPI } from '@mathesar/utils/api';

  const dispatch = createEventDispatcher<{ success: { dataFileId: number } }>();

  let url: string;

  async function importFromURL() {
    const response = await postAPI<{ id: number }>('/api/db/v0/data_files/', {
      url,
    });
    dispatch('success', { dataFileId: response.id });
  }
</script>

<div class="help-content">Enter a URL pointing to data to download:</div>

<TextInput bind:value={url} aria-label="URL" />

<div class="buttons">
  <SpinnerButton onClick={importFromURL} label="Continue" disabled={!url} />
</div>
