<script lang="ts">
  import type { WritableMap } from '@mathesar-component-library';

  import type { EphemeralDataFormField } from '../../data-form-utilities/AbstractEphemeralField';
  import type { DataFormManager } from '../../data-form-utilities/DataFormManager';

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
    <div class="divider" />
  {/each}
</div>

<style lang="scss">
  .fields-container {
    display: contents;

    .divider {
      height: var(--sm2);
      position: relative;
    }
  }
</style>
