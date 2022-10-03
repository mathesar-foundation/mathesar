<script lang="ts">
  import {
    LabelController,
    setLabelControllerInContext,
  } from './LabelController';
  import { getLabelIdFromInputId } from './labelUtils';

  export let controller = new LabelController();

  $: setLabelControllerInContext(controller);
  $: ({ inputId, disabled } = controller);

  function handleClick() {
    const inputElement = document.querySelector(`#${$inputId}`) as
      | HTMLInputElement
      | undefined;
    // Why do we imperatively focus the input element when the DOM performs this
    // behavior natively? Because we might need to associate a label with a
    // custom input component that doesn't have that doesn't contain any native
    // DOM elements with that behavior.
    inputElement?.focus();
  }
</script>

<!--
  TODO use a better class name. We already had some "label" classes in use. We
  need to figure out how to avoid naming collisions here.
-->
<label
  for={$inputId}
  class="label-component"
  class:disabled={$disabled}
  id={getLabelIdFromInputId($inputId)}
  on:click={handleClick}
>
  <slot inputId={$inputId} />
</label>

<style>
  .label-component {
    display: var(--display, inline);
  }
</style>
