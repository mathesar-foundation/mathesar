<script lang="ts">
  import {
    Label,
    LabelController,
    setLabelControllerInContext,
  } from '@mathesar-component-library';

  const labelController = new LabelController();
  $: setLabelControllerInContext(labelController);

  export let label: string;
  export let help: string | undefined = undefined;
</script>

<div class="left">
  <Label controller={labelController}>
    {label}
  </Label>
</div>

<div class="right">
  <div class="input">
    <slot {labelController} />
  </div>
  {#if help}
    <div class="help">
      {help}
    </div>
  {/if}
</div>

<style lang="scss">
  .left {
    display: flex;
    align-items: center;
    justify-content: end;
  }
</style>
