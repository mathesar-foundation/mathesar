<script lang="ts">
  import type { ToastEntry } from '../ToastController';

  export let entry: ToastEntry;

  $: ({ props, controller } = entry);
</script>

<div class="custom-toast-item">
  <div class="decoration">TOAST</div>
  <div class="message">{props.message}</div>
  <div><button on:click={controller.dismiss}>bye</button></div>
</div>

<style>
  .custom-toast-item {
    background: #ff1eec;
    padding: 1em;
    border-radius: 0.2rem;
    text-align: center;
    color: white;
  }
  .decoration {
    font-weight: bold;
    font-style: italic;
    font-size: 130%;
    color: rgba(255, 255, 255, 0.4);
  }
</style>
