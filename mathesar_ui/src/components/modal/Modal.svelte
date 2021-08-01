<script lang="ts">
  import Portal from 'svelte-portal/src/Portal.svelte';

  export let overlayTarget = 'body';

  // Additional classes
  let classes = '';
  export { classes as class };

  // Inline styles
  export let style = '';
</script>

<div class="modal-wrapper">
  <div class={['modal', classes].join(' ')} {style}>
    <slot/>
  </div>
</div>

<Portal target={overlayTarget}>
  <div class="overlay"></div>
</Portal>

<style global lang="scss">
  @import "Modal.scss";
</style>
