<script lang="ts">
  import { zip } from 'iter-tools';
  import { _ } from 'svelte-i18n';

  import { api } from '@mathesar/api/rpc';
  import type { Database } from '@mathesar/models/Database';
  import {
    type RpcResponse,
    batchSend,
  } from '@mathesar/packages/json-rpc-client-builder';
  import {
    CancelOrProceedButtonPair,
    portalToWindowFooter,
  } from '@mathesar-component-library';

  import DatabaseUpgradeError from './DatabaseUpgradeError';

  export let databases: Database[];
  export let refreshDatabaseList: () => Promise<void>;
  export let onCancel: () => void;
  export let onFinish: (errors: DatabaseUpgradeError[]) => void;

  function* getErrors(responses: Iterable<RpcResponse<unknown>>) {
    for (const [database, response] of zip(databases, responses)) {
      if (response.status === 'error') {
        yield new DatabaseUpgradeError(database, response.message);
      }
    }
  }

  async function submit() {
    const responses = await batchSend(
      databases.map((d) => api.databases.upgrade_sql({ database_id: d.id })),
    );
    onFinish([...getErrors(responses)]);
    try {
      await refreshDatabaseList();
    } catch (e) {
      // swallow errors here (I'm cutting corners)
    }
  }
</script>

<p>{$_('bulk_upgrade_database_form_info')}</p>
<p>{$_('the_following_databases_will_be_upgraded')}</p>
<ul>
  {#each databases as database}
    <li>{database.displayName}</li>
  {/each}
</ul>

<div use:portalToWindowFooter>
  <CancelOrProceedButtonPair
    onProceed={submit}
    {onCancel}
    proceedButton={{ label: $_('upgrade_databases') }}
    cancelButton={{ label: $_('cancel') }}
  />
</div>
