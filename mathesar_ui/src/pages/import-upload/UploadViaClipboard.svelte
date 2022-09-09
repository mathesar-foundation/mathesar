<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { SpinnerButton, TextArea } from '@mathesar/component-library';
  import { postAPI } from '@mathesar/utils/api';

  const dispatch = createEventDispatcher<{ success: { dataFileId: number } }>();

  let clipboardContent = '';

  async function importFromText() {
    const response = await postAPI<{ id: number }>('/api/db/v0/data_files/', {
      paste: clipboardContent,
    });
    dispatch('success', { dataFileId: response.id });
  }
</script>

<div class="help-content">Paste your data below:</div>

<TextArea bind:value={clipboardContent} rows={10} />

<div class="buttons">
  <SpinnerButton
    onClick={importFromText}
    label="Continue"
    disabled={!clipboardContent}
  />
</div>
