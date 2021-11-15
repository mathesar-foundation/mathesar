<script lang="ts">
  import { faTimes } from '@fortawesome/free-solid-svg-icons';
  import { Icon } from '..';
  import type { ToastEntry } from './ToastController';
  
  export let entry: ToastEntry;

  $: ({ props, controller } = entry);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  $: ({ progress, dismiss } = controller);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  $: ({ pause, resume } = progress);
</script>

<div class="toast-item" on:mouseenter={pause} on:mouseleave={resume}>
  {#if props.icon}
    <div class="icon"><Icon {...props.icon} /></div>
  {/if}
  <div class="content">
    {#if props.title}
      <div class="title">{props.title}</div>
    {/if}
    {#if props.message}
      <div class="message">{props.message}</div>
    {/if}
  </div>
  {#if props.allowDismiss}
    <div
      class="close-button"
      role="button"
      tabindex="-1"
      on:click={dismiss}
    >
      <Icon data={faTimes} />
    </div>
  {/if}
  {#if props.hasProgress}
    <progress value={$progress} />
  {/if}
</div>
  
<style global lang="scss">
  @import "ToastItem.scss";
</style>
