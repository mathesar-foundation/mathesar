<script lang="ts">
  import type { WritableMap } from '@mathesar-component-library';

  import type { DataFormManager } from '../DataFormManager';
  import type { EphemeralDataFormField } from '../EphemeralDataForm';

  import DataFormFieldDivider from './DataFormFieldDivider.svelte';
  import DataFormFieldElement from './DataFormFieldElement.svelte';

  export let dataFormManager: DataFormManager;
  export let fields: WritableMap<
    EphemeralDataFormField['key'],
    EphemeralDataFormField
  >;
</script>

<div class="fields-container">
  {#each [...$fields.values()] as ephField (ephField.key)}
    <DataFormFieldElement {dataFormManager} dataFormField={ephField} />
    <DataFormFieldDivider {dataFormManager} table={ephField.table} />
  {/each}
</div>

<style lang="scss">
  .fields-container {
    display: contents;
  }
</style>
