<script lang="ts">
  import { first } from 'iter-tools';
  import { _ } from 'svelte-i18n';

  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import { sortableContainer } from '@mathesar/components/sortable/sortable';
  import { iconAddNew, iconField, iconText } from '@mathesar/icons';
  import type { Database } from '@mathesar/models/Database';
  import type {
    ProcessedColumn,
    ProcessedColumns,
  } from '@mathesar/stores/table-data';
  import {
    ButtonMenuItem,
    DropdownMenu,
    Fieldset,
  } from '@mathesar-component-library';

  import FieldPart from './FieldPart.svelte';
  import { TemplateConfig } from './TemplateConfig';
  import TextPart from './TextPart.svelte';

  export let database: Pick<Database, 'id'>;
  export let templateConfig: TemplateConfig;
  export let columns: ProcessedColumns;
  export let errorsDisplayed: string[] = [];

  function deletePart(key: number) {
    templateConfig = templateConfig.withoutPart(key);
  }

  function replacePart(key: number, part: string | number[]) {
    templateConfig = templateConfig.withPartReplaced(key, part);
  }

  function addText() {
    templateConfig = templateConfig.withPartAppended('');
  }

  function addColumn() {
    const column = first(columns.values()) as ProcessedColumn;
    templateConfig = templateConfig.withPartAppended([column.id]);
  }
</script>

<Fieldset label={$_('custom_fields')} boxed>
  <div
    class="parts"
    use:sortableContainer={{
      getItems: () => [...templateConfig],
      onSort: (items) => {
        templateConfig = new TemplateConfig(items);
      },
    }}
  >
    {#each [...templateConfig] as [key, part] (key)}
      {#if typeof part === 'string'}
        <TextPart
          text={part}
          onUpdate={(text) => replacePart(key, text)}
          onDelete={() => deletePart(key)}
        />
      {:else}
        <FieldPart
          columnIds={part}
          {columns}
          {database}
          onDelete={() => deletePart(key)}
          onUpdate={(columnIds) => replacePart(key, columnIds)}
        />
      {/if}
    {:else}
      <div class="no-fields">{$_('no_fields_added_yet')}</div>
    {/each}
  </div>

  <div class="add">
    <DropdownMenu label={$_('add_field')} icon={iconAddNew} size="small">
      <ButtonMenuItem
        label={$_('column')}
        icon={iconField}
        on:click={addColumn}
      />
      <ButtonMenuItem label={$_('text')} icon={iconText} on:click={addText} />
    </DropdownMenu>
  </div>

  {#if errorsDisplayed.length > 0}
    <div class="errors">
      <ErrorBox>
        {#each errorsDisplayed as error}
          <p>{error}</p>
        {/each}
      </ErrorBox>
    </div>
  {/if}
</Fieldset>

<style>
  .parts {
    --column-select-margin: 0.25rem;
    margin: 0.5rem 0;
    display: grid;
    /* We want a visual gap of 1rem but we already have some margin set on each
    column select (to take effect when flex wrapping happens), so we need to
    subtract that. */
    gap: calc(1rem - var(--column-select-margin));
  }
  .no-fields {
    text-align: center;
    color: var(--color-text-muted);
    font-size: var(--text-size-small);
  }
  .add {
    margin-top: 1rem;
    display: flex;
    justify-content: flex-end;
  }
  .errors {
    margin: 1rem 0 0 1rem;
  }
</style>
