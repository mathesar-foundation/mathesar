<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import {
    SpinnerButton,
    TextInput,
    LabeledInput,
    Button,
  } from '@mathesar/component-library';
  import { postAPI } from '@mathesar/api/utils/requestUtils';
  import { LL } from '@mathesar/i18n/i18n-svelte';
  import RichText from '@mathesar/components/RichText.svelte';
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
  label={$LL.uploadViaUrl.enterUrlOfFileToImport()}
  layout="stacked"
>
  <TextInput bind:value={url} aria-label="URL" disabled={isLoading} />
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
      onClick={importFromURL}
      label={$LL.general.continue()}
      disabled={!url || isLoading}
      class="continue-action"
    />
  </div>
{/if}
