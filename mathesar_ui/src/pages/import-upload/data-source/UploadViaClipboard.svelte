<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import { postAPI } from '@mathesar/api/utils/requestUtils';
  import { LabeledInput, TextArea } from '@mathesar/component-library';
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

<LabeledInput label="Paste the data you want to import" layout="stacked">
  <TextArea bind:value={clipboardContent} rows={10} disabled={isLoading} />
</LabeledInput>
