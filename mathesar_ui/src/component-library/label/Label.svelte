<script lang="ts">
  import {
    LabelController,
    setLabelControllerInContext,
  } from './LabelController';

  export let controller = new LabelController();

  $: setLabelControllerInContext(controller);
  $: ({ inputId, disabled } = controller);
</script>

<!--
  TODO use a better class name. We already had some "label" classes in use. We
  need to figure out how to avoid naming collisions here.
-->
<label for={$inputId} class="label-component" class:disabled={$disabled}>
  <slot inputId={$inputId} />
</label>

<style>
  .label-component {
    display: var(--display, inline);
  }
</style>
