<script lang="ts">
  import { Button } from '@mathesar-component-library';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import { ApiMultiError } from '@mathesar/api/utils/errors';
  import { QUERY_CONTAINS_DELETED_COLUMN } from '@mathesar/api/utils/errorCodes';

  export let errors: ApiMultiError | string[];
</script>

<div class="query-run-errors">
  <ErrorBox fullWidth>
    <p class="error-header">The result could not be displayed.</p>
    {#if errors instanceof ApiMultiError}
      {#each errors.errors as apierror}
        <ul>
          {#if apierror.code === QUERY_CONTAINS_DELETED_COLUMN}
            <li class="error">
              <p class="strong">
                Some of the columns present in the query are missing in the
                underlying base table.
              </p>
              <p>
                You can attempt to recover the query by auto-deleting those
                columns and the transformations ulitizing them from the query.
              </p>
              <p>
                <Button appearance="secondary">Attempt query recovery</Button>
              </p>
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
