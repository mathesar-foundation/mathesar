<script lang="ts">
  import LinkedRecord from '@mathesar/components/LinkedRecord.svelte';
  import { RichText } from '@mathesar/components/rich-text';

  export let translatedText: string;
  export let recordSummary: string;
</script>

<div class="i18n-text-with-record-summary">
  <RichText text={translatedText} wrapStaticText let:slotName>
    {#if slotName === 'recordName'}
      <span class="record-summary">
        <LinkedRecord {recordSummary} />
      </span>
    {/if}
  </RichText>
</div>

<style>
  .i18n-text-with-record-summary {
    overflow: hidden;
    max-width: 100%;
    display: flex;
    gap: 0.4em;
  }
  .i18n-text-with-record-summary > :global(.static) {
    flex: 0 0 auto;
  }
  .record-summary {
    font-size: var(--sm1);
    display: inline-grid;
  }
</style>
