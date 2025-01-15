<script lang="ts">
  import { get } from 'svelte/store';
  import { _ } from 'svelte-i18n';

  import EntityContainerWithFilterBar from '@mathesar/components/EntityContainerWithFilterBar.svelte';
  import Errors from '@mathesar/components/errors/Errors.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import { DatabaseRouteContext } from '@mathesar/contexts/DatabaseRouteContext';
  import { iconAddNew } from '@mathesar/icons';
  import type { Schema } from '@mathesar/models/Schema';
  import { highlightNewItems } from '@mathesar/packages/new-item-highlighter';
  import { confirmDelete } from '@mathesar/stores/confirmation';
  import { modal } from '@mathesar/stores/modal';
  import {
    deleteSchema as deleteSchemaAPI,
    sortedSchemas as schemasStore,
  } from '@mathesar/stores/schemas';
  import AddEditSchemaModal from '@mathesar/systems/schemas/AddEditSchemaModal.svelte';
  import {
    Button,
    Icon,
    filterViaTextQuery,
    isDefinedNonNullable,
  } from '@mathesar-component-library';

  import SchemaListSkeleton from './SchemaListSkeleton.svelte';
  import SchemaRow from './SchemaRow.svelte';

  const addEditModal = modal.spawnModalController();
  const databaseRouteContext = DatabaseRouteContext.get();

  let filterQuery = '';
  let targetSchema: Schema | undefined;

  $: ({ database, underlyingDatabase } = $databaseRouteContext);
  $: void underlyingDatabase.runConservatively({ database_id: database.id });
  $: schemasMap = $schemasStore.data;
  $: schemasRequestStatus = $schemasStore.requestStatus;
  $: isLoading =
    $underlyingDatabase.isLoading ||
    schemasRequestStatus.state === 'processing';
  $: currentRoleDatabasePrivileges =
    $underlyingDatabase.resolvedValue?.currentAccess.currentRolePrivileges;
  $: displayList = [
    ...filterViaTextQuery(schemasMap.values(), filterQuery, (s) => get(s.name)),
  ];

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
      },
    });
  }

  function handleClearFilterQuery() {
    filterQuery = '';
  }
</script>

<div class="schema-list-wrapper">
  <EntityContainerWithFilterBar
    searchPlaceholder={$_('search_schemas')}
    bind:searchQuery={filterQuery}
    on:clear={handleClearFilterQuery}
  >
    <svelte:fragment slot="action">
      <Button
        on:click={addSchema}
        appearance="primary"
        disabled={!$currentRoleDatabasePrivileges?.has('CREATE')}
      >
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
    <div slot="content">
      <!--
      Re-render when changing databases to prevent re-highlighting schemas
      -->
      {#key database.id}
        <ul
          class="schema-list"
          use:highlightNewItems={{
            scrollHint: $_('schema_new_items_scroll_hint'),
          }}
        >
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
          {:else if schemasRequestStatus.state === 'processing' || isLoading}
            <SchemaListSkeleton />
          {:else if schemasRequestStatus.state === 'failure' || $underlyingDatabase.error}
            <Errors
              fullWidth
              errors={[
                ...schemasRequestStatus.errors,
                $underlyingDatabase.error,
              ].filter(isDefinedNonNullable)}
            />
          {/if}
        </ul>
      {/key}
    </div>
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

    .schema-list {
      width: 100%;
      list-style: none;
      padding: 0;
      display: flex;
      flex-direction: column;

      .schema-list-item + .schema-list-item {
        margin-top: var(--size-base);
      }
    }
  }
</style>
