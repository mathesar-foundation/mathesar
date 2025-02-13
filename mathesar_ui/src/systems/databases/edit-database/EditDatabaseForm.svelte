<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { api } from '@mathesar/api/rpc';
  import Fieldset from '@mathesar/component-library/fieldset/Fieldset.svelte';
  import {
    FieldLayout,
    FormSubmit,
    makeForm,
    optionalField,
    requiredField,
  } from '@mathesar/components/form';
  import Field from '@mathesar/components/form/Field.svelte';
  import Identifier from '@mathesar/components/Identifier.svelte';
  import WarningBox from '@mathesar/components/message-boxes/WarningBox.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import { iconUndo } from '@mathesar/icons';
  import type { Database } from '@mathesar/models/Database';
  import { databasesStore } from '@mathesar/stores/databases';
  import {
    NumberInput,
    portalToWindowFooter,
  } from '@mathesar-component-library';

  import DatabaseNicknameInput from '../common/DatabaseNicknameInput.svelte';

  export let database: Database;
  export let close: () => void;

  $: name = requiredField(database.name);
  $: nickname = optionalField(database.nickname ?? undefined);
  $: host = requiredField(database.server.host);
  $: port = requiredField(database.server.port);
  $: form = makeForm({ name, nickname, host, port });

  $: hasHostChanges = host.hasChanges;
  $: hasPortChanges = port.hasChanges;
  $: hasServerChanges = $hasHostChanges || $hasPortChanges;

  $: ({ databases } = databasesStore);
  $: otherDatabasesOnServer = [...$databases.values()].filter(
    (db) => db.server.id === database.server.id && db.id !== database.id,
  );
  $: serverChangesAffectOtherDatabases = otherDatabasesOnServer.length > 0;

  async function save() {
    await api.databases.configured
      .patch({
        database_id: database.id,
        patch: {
          name: $name,
          nickname: $nickname ?? null,
        },
      })
      .run();
    if (hasServerChanges) {
      // This request is run in sequence with the previous (instead of using RPC
      // batching) because we don't want one to fail and one to succeed.
      await api.servers.configured
        .patch({
          server_id: database.server.id,
          patch: {
            host: $host,
            port: $port,
          },
        })
        .run();
    }

    // This is not very elegant. Technically we could use the return values from
    // the patches above to mutate the store (and save an extra request). But
    // this is an uncommon operation, to probably not priority to optimize.
    await databasesStore.refresh();
    close();
  }
</script>

<Field label={$_('database_name')} layout="stacked" field={name} />

<Field field={nickname} input={{ component: DatabaseNicknameInput }} />

<FieldLayout>
  <Fieldset label={$_('postgresql_server')} boxed>
    <div class="field-group-horizontal">
      <div>
        <Field label={$_('host')} layout="stacked" field={host} />
      </div>
      <div>
        <Field
          label={$_('port')}
          layout="stacked"
          field={port}
          input={{ component: NumberInput }}
        />
      </div>
    </div>

    {#if hasServerChanges && serverChangesAffectOtherDatabases}
      <FieldLayout>
        <WarningBox fullWidth>
          <p>
            <RichText
              text={$_('postgres_server_changes_warning_1')}
              let:slotName
              let:translatedArg
            >
              {#if slotName === 'italic'}
                <em>{translatedArg}</em>
              {/if}
            </RichText>
          </p>
          <ul>
            {#each otherDatabasesOnServer as otherDatabase}
              <li><Identifier>{otherDatabase.displayName}</Identifier></li>
            {/each}
          </ul>
          <p>{$_('postgres_server_changes_warning_2')}</p>
          <p>{$_('postgres_server_changes_warning_3')}</p>
        </WarningBox>
      </FieldLayout>
    {/if}
  </Fieldset>
</FieldLayout>

<div use:portalToWindowFooter>
  <FormSubmit
    {form}
    catchErrors
    onCancel={() => form.reset()}
    onProceed={save}
    proceedButton={{ label: $_('save') }}
    cancelButton={{ label: $_('reset'), icon: iconUndo }}
  />
</div>

<style>
  .field-group-horizontal {
    display: grid;
    grid-template-columns: 3fr 1fr;
    gap: 1rem;
    margin-bottom: 1rem;
  }
</style>
