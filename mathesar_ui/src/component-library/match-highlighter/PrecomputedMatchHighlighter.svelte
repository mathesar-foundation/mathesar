<script lang="ts">
  import Match from './Match.svelte';
  import type { MatchPart } from './matchHighlighterTypes';

  export let matchParts: MatchPart[];
  export let matchComponent: typeof Match | undefined = undefined;

  /**
   * This line is only necessary because I couldn't figure out how to appease
   * TypeScript with the `matchComponent` prop.
   */
  $: match = matchComponent ?? Match;
</script>

<span class="match-highlighter">
  {#each matchParts as part}
    {#if part.isMatch}
      <svelte:component this={match}>{part.text}</svelte:component>
    {:else}
      {part.text}
    {/if}
  {/each}
</span>
