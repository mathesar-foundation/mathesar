<script lang="ts">
  import { splitMatchParts } from './matchHighlighterUtils';
  import Match from './Match.svelte';

  export let text: string;
  export let substring = '';
  export let matchComponent = Match;

  $: matchParts = splitMatchParts(text, substring);
</script>

<span class="match-highlighter">
  {#each matchParts as part}
    {#if part.isMatch}
      <svelte:component this={matchComponent}>{part.text}</svelte:component>
    {:else}
      {part.text}
    {/if}
  {/each}
</span>
