<script lang="ts">
  import { fade, fly } from 'svelte/transition'
  import { flip } from 'svelte/animate'
  import type { Readable } from 'svelte/store';
  import type { ToastEntry } from './ToastController';
  import ToastItem from './ToastItem.svelte'

  export let entries: Readable<ToastEntry[]>;
</script>
  
<ul class="toast-presenter">
  {#each $entries as entry (entry.id)}
    <li in:fly={{ x: 256 }} out:fade animate:flip={{ duration: 200 }}>
      <ToastItem {entry} />
    </li>
  {/each}
</ul>

<style global lang="scss">
  @import "ToastPresenter.scss";
</style>
