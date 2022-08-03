<script lang="ts">
  import Icon from '@mathesar-component-library-dir/icon/Icon.svelte';
  import { ensureReadable } from '@mathesar-component-library-dir/common/utils/storeUtils';
  import type { ToastEntry } from './ToastController';
  import { iconClose } from '../common/icons';

  export let entry: ToastEntry;

  $: ({ props, controller } = entry);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  $: ({ progress, dismiss } = controller);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  $: ({ pause, resume } = progress);

  $: readableTitle = ensureReadable(props.title);
  $: readableMessage = ensureReadable(props.message);
  $: readableContentComponentProps = ensureReadable(
    props.contentComponentProps,
  );
  $: readableIcon = ensureReadable(props.icon);
  $: icon = $readableIcon;
  $: readableBackgroundColor = ensureReadable(props.backgroundColor);
  $: readableTextColor = ensureReadable(props.textColor);
  $: readableProgressColor = ensureReadable(props.progressColor);
  $: style = `
    --toast-item-background-color: ${$readableBackgroundColor as string};
    --toast-item-text-color: ${$readableTextColor as string};
    --toast-item-progress-color: ${$readableProgressColor as string};
  `;
</script>

<div class="toast-item" on:mouseenter={pause} on:mouseleave={resume} {style}>
  {#if icon}
    <div class="icon"><Icon {...icon} /></div>
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
    <div class="close-button" role="button" tabindex="-1" on:click={dismiss}>
      <Icon {...iconClose} />
    </div>
  {/if}
  {#if props.hasProgress}
    <progress value={$progress} />
  {/if}
</div>
