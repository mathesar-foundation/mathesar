<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import { Icon } from '@mathesar-component-library';
  import { iconDeleteMinor } from '@mathesar/icons';

  const dispatch = createEventDispatcher();

  export let recordId: unknown;
  export let recordSummary: string | undefined = undefined;
  export let hasDeleteButton = false;
  export let recordPageHref: string | undefined = undefined;

  let isHoveringDelete = false;
  let isHoveringRecordPageLink = false;

  function handleDeleteButtonClick() {
    dispatch('delete');
  }
</script>

<span
  class="linked-record"
  class:is-hovering-delete={isHoveringDelete}
  class:is-hovering-record-page-link={isHoveringRecordPageLink}
  on:click
>
  {#if recordPageHref}
    <a
      class="record-summary record-page-link"
      title="Go to record"
      href={recordPageHref}
      on:mouseenter={() => {
        isHoveringRecordPageLink = true;
      }}
      on:mouseleave={() => {
        isHoveringRecordPageLink = false;
      }}
    >
      {recordSummary ?? String(recordId)}
    </a>
  {:else}
    <span class="record-summary">{recordSummary}</span>
  {/if}
  {#if hasDeleteButton}
    <!--
      Why do we have `span` elements in here instead of actual `button`
      elements? Because we need to be able to nest this whole component inside
      LinkedRecordInput which acts as an input (i.e. it receives focus and gets
      nested within a label). There may be a better way to do this from an a11y
      perspective.
    -->
    <span
      class="delete-button"
      on:click={handleDeleteButtonClick}
      role="button"
      aria-label="Clear value"
      title="Clear value"
      on:mouseenter={() => {
        isHoveringDelete = true;
      }}
      on:mouseleave={() => {
        isHoveringDelete = false;
      }}
    >
      <Icon {...iconDeleteMinor} />
    </span>
  {/if}
  <span class="background" />
</span>

<style>
  .linked-record {
    max-width: max-content;
    display: grid;
    grid-template: auto / 1fr auto;
    position: relative;
    isolation: isolate;
  }
  .background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: var(--color-fk);
    border-radius: 0.25rem;
    z-index: 0;
  }
  .record-page-link {
    color: inherit;
    display: block;
  }
  .record-page-link:hover {
    text-decoration: none;
  }
  .linked-record.is-hovering-record-page-link .background {
    --border-width: 0.2rem;
    left: calc(-1 * var(--border-width));
    top: calc(-1 * var(--border-width));
    box-sizing: content-box;
    border: solid var(--border-width) #666;
  }
  .record-summary {
    position: relative;
    z-index: 1;
    padding: 0.1rem 0.4rem;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .delete-button {
    position: relative;
    z-index: 1;
    opacity: 0.4;
    cursor: pointer;
    display: flex;
    align-items: center;
    padding: 0 0.3rem;
  }
  .linked-record.is-hovering-delete .background {
    background: #bbb;
    opacity: 0.5;
  }
  .linked-record.is-hovering-delete .record-summary {
    opacity: 0.5;
  }
  .linked-record.is-hovering-delete .record-page-link {
    text-decoration: none;
  }
  .delete-button:hover {
    opacity: 1;
  }
</style>
