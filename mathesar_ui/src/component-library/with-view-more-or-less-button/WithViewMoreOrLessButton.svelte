<script lang="ts">
  export let content: string;
  export let maxLength: number;

  let showComplete = false;

  $: showExpandCollapseButton = content.length > maxLength;
  $: completeText = content;
  $: truncatedText = content.slice(0, maxLength);

  function showCompleteView() {
    showComplete = true;
  }

  function showTruncatedView() {
    showComplete = false;
  }
</script>

{#if showComplete}
  <slot name="completeText" text={completeText} />
  {#if showExpandCollapseButton}
    <span
      role="button"
      class="expand-collapse-button"
      on:click={showTruncatedView}
    >
      View Less
    </span>
  {/if}
{:else}
  <slot name="truncatedText" text={`${truncatedText}...`} />
  {#if showExpandCollapseButton}
    <span
      role="button"
      class="expand-collapse-button"
      on:click={showCompleteView}
    >
      View More
    </span>
  {/if}
{/if}

<style>
  .expand-collapse-button {
    cursor: pointer;
    margin-top: 0.5rem;
    display: inline-block;
  }
</style>
