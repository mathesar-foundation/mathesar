<script lang="ts">
  import type { Table } from '@mathesar/models/Table';
  import type { WritableMap } from '@mathesar-component-library';

  import type { EphemeralDataFormField } from '../../data-form-utilities/AbstractEphemeralField';
  import {
    type DataFormManager,
    EditableDataFormManager,
  } from '../../data-form-utilities/DataFormManager';

  import AddFormFieldElementDropdown from './AddFormFieldElementDropdown.svelte';
  import DataFormFieldElement from './DataFormFieldElement.svelte';

  export let dataFormManager: DataFormManager;
  export let tableOid: Table['oid'];
  export let fields: WritableMap<
    EphemeralDataFormField['key'],
    EphemeralDataFormField
  >;
</script>

<div class="fields-container">
  {#each [...$fields.values()] as ephField (ephField.key)}
    <DataFormFieldElement {dataFormManager} dataFormField={ephField} />
    <div class="divider" />
  {:else}
    {#if dataFormManager instanceof EditableDataFormManager}
      <div class="empty-fields-state">
        <AddFormFieldElementDropdown {tableOid} {dataFormManager} />
      </div>
    {/if}
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
