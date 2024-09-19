<script lang="ts">
  import { get } from 'svelte/store';
  import { _ } from 'svelte-i18n';

  import EntityContainerWithFilterBar from '@mathesar/components/EntityContainerWithFilterBar.svelte';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import { iconAddNew } from '@mathesar/icons';
  import type { Database } from '@mathesar/models/Database';
  import type { Schema } from '@mathesar/models/Schema';
  import { confirmDelete } from '@mathesar/stores/confirmation';
  import { modal } from '@mathesar/stores/modal';
  import {
    type DBSchemaStoreData,
    deleteSchema as deleteSchemaAPI,
    schemas as schemasStore,
  } from '@mathesar/stores/schemas';
  import { removeTablesStore } from '@mathesar/stores/tables';
  import AddEditSchemaModal from '@mathesar/systems/schemas/AddEditSchemaModal.svelte';
  import { Button, Icon } from '@mathesar-component-library';

  import SchemaListSkeleton from './SchemaListSkeleton.svelte';
  import SchemaRow from './SchemaRow.svelte';

  const addEditModal = modal.spawnModalController();

  export let database: Database;

  $: schemasMap = $schemasStore.data;
  $: schemasRequestStatus = $schemasStore.requestStatus;

  let filterQuery = '';
  let targetSchema: Schema | undefined;

  function filterSchemas(
    schemaData: DBSchemaStoreData['data'],
    filter: string,
  ): Schema[] {
    const filtered: Schema[] = [];
    schemaData.forEach((schema) => {
      if (get(schema.name).toLowerCase().includes(filter.toLowerCase())) {
        filtered.push(schema);
      }
    });
    return filtered;
  }

  $: displayList = filterSchemas(schemasMap, filterQuery);

  function addSchema() {
    targetSchema = undefined;
    addEditModal.open();
  }

  function editSchema(schema: Schema) {
    targetSchema = schema;
    addEditModal.open();
  }

  function deleteSchema(schema: Schema) {
    void confirmDelete({
      identifierType: $_('schema'),
      identifierName: get(schema.name),
      body: [$_('schema_delete_warning'), $_('are_you_sure_to_proceed')],
      onProceed: async () => {
        await deleteSchemaAPI(schema);
        // TODO: Create common util to handle data clearing & sync between stores
        removeTablesStore(schema);
      },
    });
  }

  function handleClearFilterQuery() {
    filterQuery = '';
  }
</script>

<div class="schema-list-wrapper">
  <div class="schema-list-title-container">
    <h2 class="schema-list-title">{$_('schemas')} ({schemasMap.size})</h2>
  </div>
  <EntityContainerWithFilterBar
    searchPlaceholder={$_('search_schemas')}
    bind:searchQuery={filterQuery}
    on:clear={handleClearFilterQuery}
  >
    <svelte:fragment slot="action">
      <Button on:click={addSchema} appearance="primary">
        <Icon {...iconAddNew} />
        <span>{$_('create_schema')}</span>
      </Button>
    </svelte:fragment>
    <p slot="resultInfo">
      <RichText
        text={$_('schemas_matching_search', {
          values: { count: displayList.length },
        })}
        let:slotName
      >
        {#if slotName === 'searchValue'}
          <strong>{filterQuery}</strong>
        {/if}
      </RichText>
    </p>
    <ul class="schema-list" slot="content">
      {#if schemasRequestStatus.state === 'success'}
        {#each displayList as schema (schema.oid)}
          <li class="schema-list-item">
            <SchemaRow
              {database}
              {schema}
              on:edit={() => editSchema(schema)}
              on:delete={() => deleteSchema(schema)}
            />
          </li>
        {/each}
      {:else if schemasRequestStatus.state === 'processing'}
        <SchemaListSkeleton />
      {:else if schemasRequestStatus.state === 'failure'}
        <ErrorBox fullWidth>
          {#each schemasRequestStatus.errors as error (error)}
            <p>{error}</p>
          {/each}
        </ErrorBox>
      {/if}
    </ul>
  </EntityContainerWithFilterBar>
</div>

<AddEditSchemaModal
  controller={addEditModal}
  {database}
  schema={targetSchema}
/>

<style lang="scss">
  .schema-list-wrapper {
    display: flex;
    flex-direction: column;
    width: 100%;

    .schema-list-title-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .schema-list-title {
      font-size: var(--text-size-x-large);
      font-weight: 500;
      margin-top: var(--size-super-ultra-small);
    }

    .schema-list {
      width: 100%;
      list-style: none;
      padding: 0;
      display: flex;
      flex-direction: column;
      margin-top: var(--size-x-large);

      .schema-list-item + .schema-list-item {
        margin-top: var(--size-base);
      }
    }
  }
</style>
