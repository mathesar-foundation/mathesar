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
  import { LL } from '@mathesar/i18n/i18n-svelte';
  import RichText from '@mathesar/components/RichText.svelte';

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

<LabeledInput
  label={$LL.uploadViaClipboard.pasteDataToUpload()}
  layout="stacked"
>
  <TextArea bind:value={clipboardContent} rows={10} disabled={isLoading} />
</LabeledInput>
<div class="help-content">
  <RichText text={$LL.general.dataMustBeTabular()} let:slotName>
    {#if slotName === 'documentationLink'}
      <a
        href="https://docs.mathesar.org/user-guide/importing-data/"
        target="_blank"
      >
        {$LL.general.documentation()}
      </a>
    {/if}
  </RichText>
</div>

<slot />

{#if !hideAllActions}
  <div class="buttons">
    {#if showCancelButton}
      <Button appearance="secondary" on:click={() => dispatch('cancel')}>
        {$LL.general.cancel()}
      </Button>
    {/if}
    <SpinnerButton
      onClick={importFromText}
      label={$LL.general.continue()}
      disabled={!clipboardContent || isLoading}
      class="continue-action"
    />
  </div>
{/if}
