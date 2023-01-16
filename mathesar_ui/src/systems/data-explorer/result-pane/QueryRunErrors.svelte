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
</script>

<div class="query-run-errors">
  <ErrorBox fullWidth>
    <p class="error-header">The result could not be displayed.</p>
    {#if errors instanceof ApiMultiError}
      {#each errors.errors as apierror}
        <ul>
          {#if apierror.code === QUERY_CONTAINS_DELETED_COLUMN && hasProperty(apierror.detail, 'column_id')}
            <li class="error">
              <p class="strong">
                Some of the columns present in the query are missing in the
                underlying base table.
              </p>
              <p>
                {apierror.detail.column_id}
              </p>
              {#if queryManager}
                <p>
                  You can attempt to recover the query by removing those columns
                  and the transformations ulitizing them by clicking on the
                  following button.
                </p>
                <p>
                  <Button appearance="secondary">Delete missing columns</Button>
                </p>
              {:else if $currentDatabase && $currentSchema && $query.id}
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
    p + p {
      margin-top: var(--size-xx-small);
    }

    ul {
      list-style: disc outside none;
      padding-left: 1rem;
      font-size: var(--text-size-base);
    }
  }
</style>
