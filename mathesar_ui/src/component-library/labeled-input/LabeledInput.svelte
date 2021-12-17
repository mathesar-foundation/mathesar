<script lang="ts">
  import Label from '@mathesar-component-library-dir/label/Label.svelte';
  
  export let label: string | undefined = undefined;
  export let inputFirst = false;
</script>

<div
  class="input-with-label-after"
  class:input-first={inputFirst}
>
  <Label>
    <span class="label-content">
      <span class=label>
        {#if $$slots.label}<slot name=label />{:else}{label}{/if}
      </span>
      <span class=input><slot /></span>
    </span>
  </Label>
</div>

<style global lang="scss">
  @import './LabeledInput.scss';
</style>
