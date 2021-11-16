<script lang="ts">
  import { faTimes } from '@fortawesome/free-solid-svg-icons';
  import { Icon } from '..';
  import { ensureReadable } from '../common/utils/storeUtils';
  import type { ToastEntry } from './ToastController';
  
  export let entry: ToastEntry;

  $: ({ props, controller } = entry);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  $: ({ progress, dismiss } = controller);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  $: ({ pause, resume } = progress);

  $: readableTitle = ensureReadable(props.title);
  $: readableMessage = ensureReadable(props.message);
  $: readableContentComponentProps = ensureReadable(props.contentComponentProps);
  $: readableIcon = ensureReadable(props.icon);
  $: readableBackgroundColor = ensureReadable(props.backgroundColor);
  $: readableTextColor = ensureReadable(props.textColor);
  $: readableProgressColor = ensureReadable(props.progressColor);
</script>

<div
  class="toast-item"
  on:mouseenter={pause}
  on:mouseleave={resume}
  style={`
    --toast-item-background-color: ${$readableBackgroundColor};
    --toast-item-text-color: ${$readableTextColor};
    --toast-item-progress-color: ${$readableProgressColor};
  `}
>
  {#if props.icon}
    <div class="icon"><Icon {...$readableIcon} /></div>
  {/if}
  <div class="content">
    {#if props.contentComponent}
       <svelte:component
        this={props.contentComponent}
        {...$readableContentComponentProps}
      />
    {:else}
      {#if props.title}
        <div class="title">{$readableTitle}</div>
      {/if}
      {#if props.message}
        <div class="message">{$readableMessage}</div>
      {/if}
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
