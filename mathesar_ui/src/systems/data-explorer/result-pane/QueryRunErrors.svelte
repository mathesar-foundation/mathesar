<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { QUERY_CONTAINS_DELETED_COLUMN } from '@mathesar/api/rest/utils/errorCodes';
  import { ApiMultiError } from '@mathesar/api/rest/utils/errors';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import { getExplorationEditorPageUrl } from '@mathesar/routes/urls';
  import { currentDatabase } from '@mathesar/stores/databases';
  import { currentSchema } from '@mathesar/stores/schemas';
  import { Button, hasProperty } from '@mathesar-component-library';

  import QueryManager from '../QueryManager';
  import type QueryRunner from '../QueryRunner';

  export let queryHandler: QueryRunner | QueryManager;
  export let errors: ApiMultiError | string[];

  $: queryManager =
    queryHandler instanceof QueryManager ? queryHandler : undefined;
  $: ({ query } = queryHandler);

  function deleteMissingColumns(column_id: number) {
    if (queryManager) {
      void queryManager.update((q) => q.withoutColumnsById([column_id]));
    }
  }
</script>

<div class="query-run-errors">
  <ErrorBox fullWidth>
    <p class="error-header">{$_('result_could_not_be_displayed')}</p>
    {#if errors instanceof ApiMultiError}
      {#each errors.errors as apierror}
        <ul>
          {#if apierror.code === QUERY_CONTAINS_DELETED_COLUMN && hasProperty(apierror.detail, 'column_id')}
            {@const columnId = Number(apierror.detail.column_id)}
            <li class="error">
              <p class="strong">
                {$_('some_columns_in_query_missing')}
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
                  {$_('recover_query_click_button')}
                </p>
                {#if initialColumns.length > 0}
                  <p>{$_('this_will_remove_following_columns')}</p>
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
                  <p>{$_('this_will_remove_following_transformations')}</p>
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
                    {$_('attempt_exploration_recovery')}
                  </Button>
                </p>
              {:else if $currentDatabase && $currentSchema && $query.id}
                <p>
                  {$_('edit_exploration_attempt_recovery')}
                </p>
                <p>
                  <a
                    class="btn btn-secondary"
                    href={getExplorationEditorPageUrl(
                      $currentDatabase.id,
                      $currentSchema.oid,
                      $query.id,
                    )}
                  >
                    {$_('edit_in_data_explorer')}
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
