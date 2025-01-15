<script lang="ts">
  import { map, splitGroups } from 'iter-tools';
  import { _ } from 'svelte-i18n';

  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import SeeDocsToLearnMore from '@mathesar/components/SeeDocsToLearnMore.svelte';
  import { RpcError } from '@mathesar/packages/json-rpc-client-builder';
  import { partitionAsArray } from '@mathesar/utils/iterUtils';

  import { NoConnectionAvailable, PsycopgOperationalError } from './errorCodes';
  import ErrorList from './ErrorList.svelte';

  const RpcErrorsWithDedicatedUI = new Set([
    NoConnectionAvailable,
    PsycopgOperationalError,
  ]);

  export let errors: (string | RpcError)[];
  export let fullWidth = false;

  /**
   * Our typescript version used in package.json is not smart enough
   * to identify the types here. Until we uprade we would have to use the
   * `as` keyword.
   */
  $: [rpcErrors, stringErrors] = partitionAsArray(
    errors,
    (err) => err instanceof RpcError,
  ) as [RpcError[], string[]];
  $: [rpcErrorsWithDedicatedUI, rpcErrorsWithoutDedicatedUI] = [
    ...partitionAsArray(rpcErrors, (err) =>
      RpcErrorsWithDedicatedUI.has(err.code),
    ),
  ];
  $: rpcErrorsWithDedicatedUIGroupedByCode = new Map<number, RpcError[]>(
    map(
      ([code, errs]) => [code, [...errs]],
      splitGroups((rpcErr) => rpcErr.code, rpcErrorsWithDedicatedUI),
    ),
  );

  $: errorStrings = [
    ...map((err) => err.message, rpcErrorsWithoutDedicatedUI),
    ...stringErrors,
  ];
</script>

<div class="errors">
  {#if rpcErrorsWithDedicatedUIGroupedByCode.has(NoConnectionAvailable)}
    <ErrorBox {fullWidth}>
      {$_('not_a_collaborator_help')}
      <SeeDocsToLearnMore page="collaborators" />
    </ErrorBox>
  {/if}

  {#if rpcErrorsWithDedicatedUIGroupedByCode.has(PsycopgOperationalError)}
    <ErrorBox {fullWidth}>
      <div>{$_('unable_to_connect_to_database')}</div>
      <div>
        <ErrorList
          errorStrings={rpcErrorsWithDedicatedUIGroupedByCode
            .get(PsycopgOperationalError)
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
