<script lang="ts">
  import type { TableEntry } from '@mathesar/api/tables';
  import type { JoinableTablesResult } from '@mathesar/api/tables/joinable_tables';
  import { Icon, Spinner } from '@mathesar/component-library';
  import EntityType from '@mathesar/components/EntityType.svelte';
  import {
    FormSubmit,
    makeForm,
    optionalField,
  } from '@mathesar/components/form';
  import Identifier from '@mathesar/components/Identifier.svelte';
  import { iconRecord, iconSave } from '@mathesar/icons';
  import type { TableStructure } from '@mathesar/stores/table-data';
  import { currentTable } from '@mathesar/stores/tables';
  import { getAPI } from '@mathesar/utils/api';
  import DirectField from './DirectField.svelte';
  import type RecordStore from './RecordStore';
  import Widgets from './Widgets.svelte';

  export let record: RecordStore;
  export let tableStructure: TableStructure;

  $: table = $currentTable as TableEntry;
  $: ({ processedColumns } = tableStructure);
  $: ({ recordId, summary, fieldValues } = record);
  $: fieldPropsObjects = [...$processedColumns.values()].map((c) => ({
    processedColumn: c,
    field: optionalField($fieldValues.get(c.id)),
  }));
  $: formFields = Object.fromEntries(
    fieldPropsObjects.map((o) => [o.processedColumn.id, o.field]),
  );
  $: form = makeForm(formFields);

  function getJoinableTablesResult(tableId: number) {
    return getAPI<JoinableTablesResult>(
      `/api/db/v0/tables/${tableId}/joinable_tables/?max_depth=1`,
    );
  }

  async function save() {
    await record.patch($form.values);
  }
</script>

<div><EntityType><Identifier>{table.name}</Identifier> Record</EntityType></div>
<h1><Icon {...iconRecord} />{$summary}</h1>

<section class="fields-section">
  <div class="fields">
    {#each fieldPropsObjects as { field, processedColumn } (processedColumn.id)}
      <DirectField {record} {processedColumn} {field} />
    {/each}
  </div>
  <div class="submit">
    <FormSubmit
      {form}
      proceedButton={{ label: 'Save', icon: iconSave }}
      onProceed={save}
      initiallyHidden
      onCancel={() => form.reset()}
    />
  </div>
</section>

<div class="widgets">
  {#await getJoinableTablesResult(table.id)}
    <Spinner />
  {:then joinableTablesResult}
    <Widgets {joinableTablesResult} {recordId} />
  {/await}
</div>

<style>
  .fields-section {
    margin: 3rem 0;
  }
  .fields {
    display: grid;
    grid-template-columns: auto 1fr;
  }
  .submit {
    margin-top: 2rem;
  }
  .submit:empty {
    display: none;
  }
</style>
