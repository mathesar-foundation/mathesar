<script lang="ts">
  import { derived } from 'svelte/store';

  import { iconClose } from '@mathesar-component-library-dir/common/icons';
  import { ensureReadable } from '@mathesar-component-library-dir/common/utils/storeUtils';
  import Icon from '@mathesar-component-library-dir/icon/Icon.svelte';

  import type { ToastEntry } from './ToastController';

  export let entry: ToastEntry;

  $: ({ props, controller } = entry);
  $: ({ progress, dismiss } = controller);
  $: ({ pause, resume } = progress);

  $: readableTitle = ensureReadable(props.title);
  $: readableMessage = ensureReadable(props.message);
  $: readableContentComponentProps = ensureReadable(
    props.contentComponentProps,
  );
  $: readableIcon = ensureReadable(props.icon);
  $: icon = $readableIcon;

  $: style = derived(
    [
      ensureReadable(props.backgroundColor),
      ensureReadable(props.textColor),
      ensureReadable(props.progressColor),
    ],
    ([backgroundColor, textColor, progressColor]) => {
      const styles: string[] = [];
      function add(propertyName: string, value: string | undefined) {
        if (!value) return;
        styles.push(`${propertyName}: ${value};`);
      }
      add('--semantic-info-bg', backgroundColor);
      add('--text-primary', textColor);
      add('--ToastItem__progress-color', progressColor);
      return styles.join(' ');
    },
  );
</script>

<div
  class="toast-item"
  on:mouseenter={pause}
  on:mouseleave={resume}
  style={$style}
>
  <div class="header">
    {#if icon}
      <div class="icon"><Icon {...icon} /></div>
    {/if}
    {#if props.title}
      <div class="title">{$readableTitle}</div>
    {/if}
    {#if props.allowDismiss}
      <div class="close-button" role="button" tabindex="-1" on:click={dismiss}>
        <Icon {...iconClose} />
      </div>
    {/if}
  </div>
  {#if props.contentComponent || props.message}
    <div class="message">
      {#if props.contentComponent}
        <svelte:component
          this={props.contentComponent}
          {...$readableContentComponentProps}
        />
      {:else if props.message}
        {$readableMessage}
      {/if}
    </div>
  {/if}
  {#if props.hasProgress}
    <progress value={$progress} />
  {/if}
</div>
