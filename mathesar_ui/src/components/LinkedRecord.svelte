<script lang="ts">
  import { Icon } from '@mathesar-component-library';
  import { iconDeleteMinor } from '@mathesar/icons';
  import {
    renderTransitiveRecordSummary,
    type DataForRecordSummaryInFkCell,
  } from '@mathesar/stores/table-data/record-summaries/recordSummaryUtils';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let recordId: unknown;
  export let dataForRecordSummaryInFkCell:
    | DataForRecordSummaryInFkCell
    | undefined;
  export let hasDeleteButton: boolean = false;

  $: recordSummary = dataForRecordSummaryInFkCell
    ? renderTransitiveRecordSummary(dataForRecordSummaryInFkCell)
    : String(recordId);

  function handleDeleteButtonClick() {
    dispatch('delete');
  }
</script>

<span class="linked-record" class:has-delete-button={hasDeleteButton}>
  <span class="record-summary">{recordSummary}</span>
  {#if hasDeleteButton}
    <!--
    Why is `.delete-button` not an actual `button` element? Because we need to
    be able to nest it inside LinkedRecordInput which acts as an input (i.e. it
    receives focus and gets nested within a label). There may be a better way to
    do this from an a11y perspective.
   -->
    <span
      class="delete-button"
      on:click|stopPropagation={handleDeleteButtonClick}
      role="button"
      aria-label="Clear value"
      title="Clear value"
    >
      <Icon {...iconDeleteMinor} />
    </span>
  {/if}
</span>

<style>
  .linked-record {
    background: var(--color-fk);
    border-radius: 0.25rem;
    max-width: max-content;
    display: grid;
    grid-template: auto / 1fr auto;
  }
  .record-summary {
    padding: 0.1rem 0.4rem;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .delete-button {
    opacity: 0.4;
    cursor: pointer;
    display: flex;
    align-items: center;
    padding: 0 0.3rem;
  }
  .delete-button:hover {
    opacity: 1;
  }
</style>
