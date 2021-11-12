<script lang="ts">
  import type { ToastEntry } from './ToastController';
  
  export let entry: ToastEntry;

  $: ({ props, controller } = entry);
  $: ({ progress, dismiss } = controller);
  $: ({ pause, resume } = progress);
</script>

<div class="_toastItem" on:mouseenter={pause} on:mouseleave={resume}>
  <div class="_toastMsg">
    {props.message}
  </div>
  {#if props.allowDismiss}
    <div class="_toastBtn pe" role="button" tabindex="-1" on:click={dismiss}>✕</div>
  {/if}
  <progress class="_toastBar" value={$progress} />
</div>
  
<style>
  ._toastItem {
    width: var(--toastWidth, 16rem);
    height: var(--toastHeight, auto);
    min-height: var(--toastMinHeight, 3.5rem);
    margin: var(--toastMargin, 0 0 0.5rem 0);
    padding: var(--toastPadding, 0);
    background: var(--toastBackground, rgba(66, 66, 66, 0.9));
    color: var(--toastColor, #fff);
    box-shadow: var(--toastBoxShadow, 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06));
    border: var(--toastBorder, none);
    border-radius: var(--toastBorderRadius, 0.125rem);
    position: relative;
    display: flex;
    flex-direction: row;
    align-items: center;
    overflow: hidden;
    will-change: transform, opacity;
    -webkit-tap-highlight-color: transparent;
  }
  ._toastMsg {
    padding: var(--toastMsgPadding, 0.75rem 0.5rem);
    flex: 1 1 0%;
  }
  .pe,
  ._toastMsg :global(a) {
    pointer-events: auto;
  }
  ._toastBtn {
    width: 2rem;
    height: 100%;
    font: 1rem sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    outline: none;
  }
  ._toastBar {
    top: var(--toastBarTop, auto);
    right: var(--toastBarRight, auto);
    bottom: var(--toastBarBottom, 0);
    left: var(--toastBarLeft, 0);
    height: var(--toastBarHeight, 6px);
    width: var(--toastBarWidth, 100%);
    position: absolute;
    display: block;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    border: none;
    background: transparent;
    pointer-events: none;
  }
  ._toastBar::-webkit-progress-bar {
    background: transparent;
  }
  /* `--toastProgressBackground` renamed to `--toastBarBackground`; override included for backward compatibility */
  ._toastBar::-webkit-progress-value {
    background: var(--toastProgressBackground, var(--toastBarBackground, rgba(33, 150, 243, 0.75)));
  }
  ._toastBar::-moz-progress-bar {
    background: var(--toastProgressBackground, var(--toastBarBackground, rgba(33, 150, 243, 0.75)));
  }
</style>
