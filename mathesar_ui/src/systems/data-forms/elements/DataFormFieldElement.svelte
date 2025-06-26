<script lang="ts">
  import type { DataFormManager } from '../DataFormManager';
  import type { EphemeralDataFormField } from '../EphemeralDataForm';

  import FkFormFieldElement from './FkFormFieldElement.svelte';
  import ScalarFormFieldElement from './ScalarFormFieldElement.svelte';

  export let dataFormManager: DataFormManager;
  export let dataFormField: EphemeralDataFormField;
</script>

<div>
  {#if dataFormField.kind === 'scalar_column'}
    <ScalarFormFieldElement {dataFormManager} {dataFormField} />
  {:else if dataFormField.kind === 'foreign_key'}
    <FkFormFieldElement {dataFormManager} {dataFormField} />
  {:else}
    <div></div>
  {/if}
</div>
