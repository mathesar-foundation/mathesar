<script lang="ts">
  import { portal } from '@mathesar-components';

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

<div class="overlay" use:portal></div>

<style global lang="scss">
  @import "Modal.scss";
</style>
