<script lang="ts">
  import { Button, hasProperty } from '@mathesar-component-library';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import { ApiMultiError } from '@mathesar/api/utils/errors';
  import { QUERY_CONTAINS_DELETED_COLUMN } from '@mathesar/api/utils/errorCodes';
  import { getExplorationEditorPageUrl } from '@mathesar/routes/urls';
  import { currentDatabase } from '@mathesar/stores/databases';
  import { currentSchema } from '@mathesar/stores/schemas';
  import type QueryRunner from '../QueryRunner';
  import QueryManager from '../QueryManager';

  export let queryHandler: QueryRunner | QueryManager;
  export let errors: ApiMultiError | string[];

  $: queryManager =
    queryHandler instanceof QueryManager ? queryHandler : undefined;
  $: ({ query } = queryHandler);

  function deleteMissingColumns(column_id: number) {
    if (queryManager) {
      queryManager.update((q) => q.withoutColumnsById([column_id]));
    }
  }
</script>

<div class="query-run-errors">
  <ErrorBox fullWidth>
    <p class="error-header">The result could not be displayed.</p>
    {#if errors instanceof ApiMultiError}
      {#each errors.errors as apierror}
        <ul>
          {#if apierror.code === QUERY_CONTAINS_DELETED_COLUMN && hasProperty(apierror.detail, 'column_id')}
            {@const columnId = Number(apierror.detail.column_id)}
            <li class="error">
              <p class="strong">
                Some of the columns present in the query are missing in the
                underlying base table.
              </p>
              {#if queryManager}
                {@const columnsAndTransformsToDelete =
                  $query.getInitialColumnsAndTransformsUtilizingThemByColumnIds(
                    [columnId],
                  )}
                {@const initialColumns =
                  columnsAndTransformsToDelete.initialColumnsUsingColumnIds}
                {@const transformsWithIndex =
                  columnsAndTransformsToDelete.transformsUsingColumnIds}
                <p>
                  You can attempt to recover the query by clicking on the button
                  below.
                </p>
                {#if initialColumns.length > 0}
                  <p>This will remove the following column(s):</p>
                  <ul class="removal-list">
                    {#each initialColumns as initialColumn (initialColumn.alias)}
                      <li>
                        {$query.display_names[initialColumn.alias] ??
                          initialColumn.alias}
                      </li>
                    {/each}
                  </ul>
                {/if}
                {#if transformsWithIndex.length > 0}
                  <p>This will remove the following transformation(s):</p>
                  <ul class="removal-list">
                    {#each transformsWithIndex as transformInfo (transformInfo)}
                      <li>
                        {transformInfo.index + 1}: {transformInfo.transform
                          .name}
                      </li>
                    {/each}
                  </ul>
                {/if}
                <p>
                  <Button
                    appearance="secondary"
                    on:click={() => deleteMissingColumns(columnId)}
                  >
                    Attempt Exploration recovery
                  </Button>
                </p>
              {:else if $currentDatabase && $currentSchema && $query.id}
                <p>
                  You can edit the exploration in the Data Explorer to attempt
                  recovering it.
                </p>
                <p>
                  <a
                    class="btn btn-secondary"
                    href={getExplorationEditorPageUrl(
                      $currentDatabase.name,
                      $currentSchema.id,
                      $query.id,
                    )}
                  >
                    Edit in Data Explorer
                  </a>
                </p>
              {/if}
            </li>
          {:else}
            <li class="error">
              {apierror.message}
            </li>
          {/if}
        </ul>
      {/each}
    {:else}
      <ul>
        {#each errors as error}
          <li class="error">{error}</li>
        {/each}
      </ul>
    {/if}
  </ErrorBox>
</div>

<style lang="scss">
  .query-run-errors {
    --ErrorBox__font-size: var(--text-size-large);

    .error-header,
    .strong {
      font-weight: 500;
    }
    .error-header {
      font-size: var(--text-size-large);
    }

    p {
      margin: 0;
    }
    p + p,
    p + ul,
    ul + p {
      margin-top: var(--size-xx-small);
    }

    ul {
      list-style: disc outside none;
      padding-left: 1.3rem;
      font-size: var(--text-size-base);
    }
  }
</style>
