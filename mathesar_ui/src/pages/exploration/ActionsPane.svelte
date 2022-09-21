<script lang="ts">
  import { router } from 'tinro';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import { Button, Icon, iconError } from '@mathesar-component-library';
  import QueryName from '@mathesar/components/QueryName.svelte';
  import EntityType from '@mathesar/components/EntityType.svelte';
  import { confirmDelete } from '@mathesar/stores/confirmation';
  import { iconDelete, iconEdit, iconRefresh } from '@mathesar/icons';
  import type { QueryRunner } from '@mathesar/systems/data-explorer/types';
  import type { QueryInstance } from '@mathesar/api/queries';
  import {
    getSchemaPageUrl,
    getExplorationEditorPageUrl,
  } from '@mathesar/routes/urls';
  import { deleteQuery } from '@mathesar/stores/queries';

  export let database: Database;
  export let schema: SchemaEntry;
  export let query: QueryInstance;
  export let queryRunner: QueryRunner;

  $: ({ runState } = queryRunner);
  $: isLoading = $runState?.state === 'processing';
  $: isError = $runState?.state === 'failure';

  function handleDeleteTable() {
    void confirmDelete({
      identifierType: 'Table',
      onProceed: async () => {
        await deleteQuery(query.id);
        router.goto(getSchemaPageUrl(database.name, schema.id));
      },
    });
  }
</script>

<div class="actions-pane">
  <div class="heading">
    <EntityType>Exploration</EntityType>
    <h1><QueryName {query} /></h1>
  </div>
  <a href={getExplorationEditorPageUrl(database.name, schema.id, query.id)}>
    <Button>
      <Icon {...iconEdit} />
      <span>Edit</span>
    </Button>
  </a>
  <Button disabled={isLoading} size="medium" on:click={handleDeleteTable}>
    <Icon {...iconDelete} />
    <span>Delete</span>
  </Button>
  <div class="loading-info">
    <Button
      size="medium"
      disabled={isLoading}
      on:click={() => queryRunner.run()}
    >
      <Icon
        {...isError && !isLoading ? iconError : iconRefresh}
        spin={isLoading}
      />
      <span>
        {#if isLoading}
          Loading
        {:else if isError}
          Retry
        {:else}
          Refresh
        {/if}
      </span>
    </Button>
  </div>
</div>

<!--
  This currently duplicates styles from table actions page.
  TODO: Make ActionsPage a common layout component
-->
<style lang="scss">
  .actions-pane {
    border-bottom: 1px solid var(--color-gray-dark);
    background-color: var(--color-white);
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding-right: 1rem;
  }
  .heading {
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--color-gray-medium);
    padding: 1rem;
    margin-right: 0.5rem;
  }
  .heading h1 {
    font-size: var(--text-size-x-large);
    font-weight: 500;
    margin-bottom: 0;
  }
  .loading-info {
    margin-left: auto;
  }
</style>
