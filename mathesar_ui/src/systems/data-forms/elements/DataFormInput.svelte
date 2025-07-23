<script lang="ts">
  import { _ } from 'svelte-i18n';

  import DynamicInput from '@mathesar/components/cell-fabric/DynamicInput.svelte';

  import type { EphermeralFkField } from '../data-form-utilities/EphemeralFkField';
  import type { EphermeralScalarField } from '../data-form-utilities/EphemeralScalarField';

  export let dataFormField: EphermeralScalarField | EphermeralFkField;
  export let isSelected: boolean;

  $: ({ fieldStore, inputComponentAndProps } = dataFormField);
  $: recordSummary = undefined; // TODO_4637

  function setRecordSummary(recordId: string, _recordSummary: string) {
    // TODO_4637
  }
</script>

<div class="data-form-input" class:selected={isSelected}>
  <DynamicInput
    bind:value={$fieldStore}
    componentAndProps={$inputComponentAndProps}
    {recordSummary}
    {setRecordSummary}
  />
</div>

<style lang="scss">
  .data-form-input {
    --input-min-height: 2.5rem;
    --text-area-min-height: 5.5rem;
  }
</style>
