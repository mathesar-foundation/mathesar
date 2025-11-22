<script lang="ts">
  import {
    Label,
    LabelController,
    setLabelControllerInContext,
  } from '@mathesar-component-library';

  const labelController = new LabelController();
  setLabelControllerInContext(labelController);

  export let label: string;
</script>

<div class="label-cell">
  <Label controller={labelController}>
    {label}
  </Label>
</div>

<div class="input-cell">
  <slot />
</div>

<style>
  .label-cell {
    padding-top: 0.5rem;
  }
</style>
