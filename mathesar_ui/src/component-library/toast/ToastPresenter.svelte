<script lang="ts">
  import type { SvelteComponent } from 'svelte';
  import { flip } from 'svelte/animate';
  import type { Readable } from 'svelte/store';
  import { fade, fly } from 'svelte/transition';

  import type { ToastEntry } from './ToastController';
  import ToastItem from './ToastItem.svelte';

  export let entries: Readable<ToastEntry[]>;
  export let toastItemComponent: typeof SvelteComponent<any> = ToastItem;
</script>

<ul class="toast-presenter">
  {#each $entries as entry (entry.id)}
    <li in:fly|global={{ x: 256 }} out:fade|global animate:flip={{ duration: 200 }}>
      <svelte:component this={toastItemComponent} {...$$restProps} {entry} />
    </li>
  {/each}
</ul>
