<script lang="ts">
  import { first } from 'iter-tools';

  import type { RecordSummaryTemplate } from '@mathesar/api/rpc/tables';
  import { sortableContainer } from '@mathesar/components/sortable/sortable';
  import { iconAddNew, iconField, iconText } from '@mathesar/icons';
  import type { Database } from '@mathesar/models/Database';
  import type {
    ProcessedColumn,
    ProcessedColumns,
  } from '@mathesar/stores/table-data';
  import { makeUniqueKeys } from '@mathesar/utils/svelteHelpers';
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
    template = [...template.slice(0, index), ...template.slice(index + 1)];
  }

  function replacePart(index: number, part: string | number[]) {
    template = [
      ...template.slice(0, index),
      part,
      ...template.slice(index + 1),
    ];
  }

  function addText() {
    // TODO focus the new text input after its added
    template = [...template, ''];
  }

  function addColumn() {
    // TODO be smarter about picking a default column
    const column = first(columns.values()) as ProcessedColumn;
    template = [...template, [column.id]];
  }
</script>

<Fieldset label="Custom Fields" boxed>
  <div
    class="parts"
    use:sortableContainer={{
      getItems: () => template,
      onSort: (newTemplate) => {
        template = newTemplate;
      },
    }}
  >
    {#each [...makeUniqueKeys(template)] as [part, key], index (key)}
      {#if typeof part === 'string'}
        <TextPart
          text={part}
          onUpdate={(text) => replacePart(index, text)}
          onDelete={() => deletePart(index)}
        />
      {:else}
        <FieldPart
          columnIds={part}
          {columns}
          {database}
          onDelete={() => deletePart(index)}
          onUpdate={(columnIds) => replacePart(index, columnIds)}
        />
      {/if}
    {/each}
  </div>

  <div class="add">
    <DropdownMenu label="Add Field" icon={iconAddNew} size="small">
      <ButtonMenuItem label="Column" icon={iconField} on:click={addColumn} />
      <ButtonMenuItem label="Text" icon={iconText} on:click={addText} />
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
