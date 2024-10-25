<script lang="ts">
  import type { RecordSummaryTemplate } from '@mathesar/api/rpc/tables';
  import { sortableContainer } from '@mathesar/components/sortable/sortable';
  import { iconAddNew, iconField, iconText } from '@mathesar/icons';
  import type { Database } from '@mathesar/models/Database';
  import type { ProcessedColumns } from '@mathesar/stores/table-data';
  import {
    ButtonMenuItem,
    DropdownMenu,
    Fieldset,
  } from '@mathesar-component-library';

  import FieldPart from './FieldPart.svelte';
  import TextPart from './TextPart.svelte';

  export let database: Pick<Database, 'id'>;
  export let template: RecordSummaryTemplate;
  export let columns: ProcessedColumns;

  function deletePart(index: number) {
    template.splice(index, 1);
  }

  function addText() {
    // TODO focus the new text input after its added
    template.push('');
  }

  function addColumn() {
    // TODO be smarter about picking a default column
    template.push([]);
  }
</script>

<Fieldset label="Custom Parts" boxed>
  <div
    class="parts"
    use:sortableContainer={{
      getItems: () => template,
      onSort: () => {
        /* TODO */
      },
    }}
  >
    {#each template as part, i}
      {#if typeof part === 'string'}
        <TextPart text={part} onDelete={() => deletePart(i)} />
      {:else}
        <FieldPart
          columnIds={part}
          {columns}
          onDelete={() => deletePart(i)}
          {database}
        />
      {/if}
    {/each}
  </div>

  <div class="add">
    <DropdownMenu label="Add Part" icon={iconAddNew} size="small">
      <ButtonMenuItem label="Text" icon={iconText} on:click={addText} />
      <ButtonMenuItem label="Column" icon={iconField} on:click={addColumn} />
    </DropdownMenu>
  </div>
</Fieldset>

<style>
  .parts {
    margin: 0.5rem 0;
    display: grid;
    gap: 1rem;
  }
  .add {
    margin-top: 1rem;
    display: flex;
    justify-content: flex-end;
  }
</style>
