<script lang="ts">
  import type { Readable } from 'svelte/store';

  import type { Table } from '@mathesar/models/Table';
  import type { ImmutableMap } from '@mathesar-component-library';

  import type { EphemeralDataFormField } from '../../data-form-utilities/AbstractEphemeralField';
  import {
    type DataFormManager,
    EditableDataFormManager,
  } from '../../data-form-utilities/DataFormManager';

  import AddFormFieldElementDropdown from './AddFormFieldElementDropdown.svelte';
  import DataFormFieldElement from './DataFormFieldElement.svelte';

  export let dataFormManager: DataFormManager;
  export let tableOid: Table['oid'];
  export let fields: Readable<
    ImmutableMap<EphemeralDataFormField['key'], EphemeralDataFormField>
  >;
</script>

<div class="fields-container">
  {#each [...$fields.values()] as ephField (ephField.key)}
    <DataFormFieldElement {dataFormManager} dataFormField={ephField} />
  {:else}
    {#if dataFormManager instanceof EditableDataFormManager}
      <div class="empty-fields-state">
        <AddFormFieldElementDropdown
          display="full"
          {tableOid}
          {dataFormManager}
        />
      </div>
    {/if}
  {/each}
</div>

<style lang="scss">
  .fields-container {
    display: contents;

    .empty-fields-state {
      padding: var(--lg1);
      margin-bottom: var(--sm4);
      border: 1px dashed var(--border-color);
    }
  }
</style>
