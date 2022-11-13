<script lang="ts">
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import { Button, Icon } from '@mathesar-component-library';
  import QueryName from '@mathesar/components/QueryName.svelte';
  import EntityType from '@mathesar/components/EntityType.svelte';
  import { iconEdit, iconInspector } from '@mathesar/icons';
  import type { QueryInstance } from '@mathesar/api/queries';
  import { getExplorationEditorPageUrl } from '@mathesar/routes/urls';

  export let database: Database;
  export let schema: SchemaEntry;
  export let query: QueryInstance;
  // export let queryRunner: QueryRunner;
  export let isInspectorOpen = true;

  // $: ({ runState } = queryRunner);
  // $: isLoading = $runState?.state === 'processing';
  // $: isError = $runState?.state === 'failure';

  // function handleDeleteExploration() {
  //   void confirmDelete({
  //     identifierType: 'Exploration',
  //     onProceed: async () => {
  //       await deleteQuery(query.id);
  //       router.goto(getSchemaPageUrl(database.name, schema.id));
  //     },
  //   });
  // }
</script>

<div class="exploration-header">
  <div class="title">
    <EntityType>Exploration</EntityType>
    <h1><QueryName {query} /></h1>
  </div>
  <div class="actions">
    <a href={getExplorationEditorPageUrl(database.name, schema.id, query.id)}>
      <Button appearance="primary">
        <Icon {...iconEdit} />
        <span>Edit in Data Explorer</span>
      </Button>
    </a>
    <Button
      appearance="secondary"
      on:click={() => {
        isInspectorOpen = !isInspectorOpen;
      }}
    >
      <Icon {...iconInspector} />
      <span>Inspector</span>
    </Button>
  </div>
  <!-- <Button disabled={isLoading} size="medium" on:click={handleDeleteExploration}>
    <Icon {...iconDeleteMajor} />
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
  </div> -->
</div>

<style lang="scss">
  .exploration-header {
    border-bottom: 1px solid var(--color-gray-dark);
    background-color: var(--color-white);
    position: relative;
    display: flex;
    align-items: center;
    padding-right: 1rem;

    .title {
      display: flex;
      flex-direction: column;
      border-right: 1px solid var(--color-gray-medium);
      padding: 1rem;
      margin-right: 0.5rem;

      h1 {
        font-size: var(--text-size-xx-large);
        font-weight: 500;
        margin-bottom: 0;
      }
    }
    .actions {
      margin-left: auto;

      a {
        margin-right: var(--size-ultra-small);
      }
    }
  }
</style>
