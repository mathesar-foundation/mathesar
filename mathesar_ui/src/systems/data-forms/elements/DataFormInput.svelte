<script lang="ts">
  import { _ } from 'svelte-i18n';

  import DynamicInput from '@mathesar/components/cell-fabric/DynamicInput.svelte';

  import type { EphermeralFkField } from '../data-form-utilities/EphemeralFkField';
  import type { EphermeralScalarField } from '../data-form-utilities/EphemeralScalarField';

  export let dataFormField: EphermeralScalarField | EphermeralFkField;
  export let isSelected: boolean;

  $: ({ fieldStore, fieldColumn } = dataFormField);
</script>

<div class="data-form-input" class:selected={isSelected}>
  <DynamicInput
    bind:value={$fieldStore}
    componentAndProps={fieldColumn.inputComponentAndProps}
  />
</div>

<style lang="scss">
  .data-form-input {
    --input-min-height: 2.5rem;
    --text-area-min-height: 5.5rem;
  }
</style>
