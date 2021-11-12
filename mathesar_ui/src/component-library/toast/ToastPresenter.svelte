<script lang="ts">
  import { fade, fly } from 'svelte/transition'
  import { flip } from 'svelte/animate'
  import type { Readable } from 'svelte/store';
  import type { ToastEntry } from './ToastController';
  import ToastItem from './ToastItem.svelte'

  export let entries: Readable<ToastEntry[]>;
</script>
  
<style>
  .toastContainer {
    top: var(--toastContainerTop, 1.5rem);
    right: var(--toastContainerRight, 2rem);
    bottom: var(--toastContainerBottom, auto);
    left: var(--toastContainerLeft, auto);
    position: fixed;
    margin: 0;
    padding: 0;
    list-style-type: none;
    /* pointer-events: none; */
    z-index: 9999;
  }
</style>
  
<ul class="toastContainer">
  {#each $entries as entry (entry.id)}
    <li in:fly={{ x: 256 }} out:fade animate:flip={{ duration: 200 }}>
      <ToastItem {entry} />
    </li>
  {/each}
</ul>
