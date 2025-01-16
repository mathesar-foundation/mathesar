<script lang="ts">
  import { map, splitGroups } from 'iter-tools';
  import { _ } from 'svelte-i18n';

  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import SeeDocsToLearnMore from '@mathesar/components/SeeDocsToLearnMore.svelte';
  import { RpcError } from '@mathesar/packages/json-rpc-client-builder';
  import { partitionAsArray } from '@mathesar/utils/iterUtils';

  import {
    NO_CONNECTION_AVAILABLE,
    PSYCOPG_OPERATIONAL_ERROR,
  } from './errorCodes';
  import ErrorList from './ErrorList.svelte';

  const rpcErrorCodesWithDedicatedUi = new Set([
    NO_CONNECTION_AVAILABLE,
    PSYCOPG_OPERATIONAL_ERROR,
  ]);

  export let errors: (string | RpcError)[];
  export let fullWidth = false;

  /**
   * Our typescript version used in package.json is not smart enough to identify
   * the types here. Until we upgrade we would have to use the `as` keyword.
   */
  $: [rpcErrors, stringErrors] = partitionAsArray(
    errors,
    (err) => err instanceof RpcError,
  ) as [RpcError[], string[]];
  $: [rpcErrorsWithDedicatedUi, rpcErrorsWithoutDedicatedUi] = [
    ...partitionAsArray(rpcErrors, (err) =>
      rpcErrorCodesWithDedicatedUi.has(err.code),
    ),
  ];
  $: rpcErrorsWithDedicatedUiGroupedByCode = new Map<number, RpcError[]>(
    map(
      ([code, errs]) => [code, [...errs]],
      splitGroups((rpcErr) => rpcErr.code, rpcErrorsWithDedicatedUi),
    ),
  );

  $: errorStrings = [
    ...map((err) => err.message, rpcErrorsWithoutDedicatedUi),
    ...stringErrors,
  ];
</script>

<div class="errors">
  {#if rpcErrorsWithDedicatedUiGroupedByCode.has(NO_CONNECTION_AVAILABLE)}
    <ErrorBox {fullWidth}>
      {$_('not_a_collaborator_help')}
      <SeeDocsToLearnMore page="collaborators" />
    </ErrorBox>
  {/if}

  {#if rpcErrorsWithDedicatedUiGroupedByCode.has(PSYCOPG_OPERATIONAL_ERROR)}
    <ErrorBox {fullWidth}>
      <div>{$_('unable_to_connect_to_database')}</div>
      <div>
        <ErrorList
          errorStrings={rpcErrorsWithDedicatedUiGroupedByCode
            .get(PSYCOPG_OPERATIONAL_ERROR)
            ?.map((err) => err.message) ?? []}
        />
      </div>
    </ErrorBox>
  {/if}

  {#if errorStrings.length}
    <ErrorBox {fullWidth}>
      <ErrorList {errorStrings} />
    </ErrorBox>
  {/if}
</div>

<style>
  .errors {
    display: flex;
    flex-direction: column;
    gap: var(--size-small);
  }
</style>
