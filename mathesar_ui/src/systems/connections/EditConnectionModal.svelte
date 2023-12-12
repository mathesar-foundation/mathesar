<script lang="ts">
  import { _ } from 'svelte-i18n';
  import {
    ControlledModal,
    type ModalController,
    PasswordInput,
  } from '@mathesar-component-library';
  import { connectionsStore } from '@mathesar/stores/databases';
  import type { Connection } from '@mathesar/api/connections';
  import Identifier from '@mathesar/components/Identifier.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import {
    FormSubmit,
    makeForm,
    requiredField,
    isInPortRange,
    optionalField,
    Field,
    FieldLayout,
    uniqueWith,
  } from '@mathesar/components/form';
  import DocsLink from '@mathesar/components/DocsLink.svelte';
  import { toast } from '@mathesar/stores/toast';
  import { getErrorMessage } from '@mathesar/utils/errors';

  export let controller: ModalController;
  export let connection: Connection;

  $: ({ connections } = connectionsStore);
  $: otherNicknames = new Set(
    $connections.filter((c) => c.id !== connection.id).map((c) => c.nickname)
  );
  $: connectionName = requiredField(connection.nickname, [
    uniqueWith(otherNicknames)
  ]);
  $: databaseName = requiredField(connection.database);
  $: host = requiredField(connection.host);
  $: port = requiredField(connection.port ?? 5432, [isInPortRange()]);
  $: username = requiredField(connection.username);
  $: password = optionalField('');
  $: form = makeForm({
    connectionName,
    databaseName,
    host,
    port,
    username,
    password,
  });

  async function save() {
    const formValues = $form.values;
    const passwordValue =
      formValues.password !== '' ? formValues.password : undefined;
    try {
      await connectionsStore.updateConnection(connection.id, {
        database: formValues.databaseName,
        host: formValues.host,
        port: formValues.port,
        username: formValues.username,
        password: passwordValue,
        nickname: formValues.connectionName,
      });
      toast.success($_('connection_updated_successfully'));
      controller.close();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  function cancel() {
    form.reset();
    controller.close();
  }
</script>

<ControlledModal {controller}>
  <svelte:fragment slot="title">
    <RichText text={$_('edit_connection_with_name')} let:slotName>
      {#if slotName === 'connectionName'}
        <Identifier>{connection.nickname}</Identifier>
      {/if}
    </RichText>
  </svelte:fragment>

  <div>
    <Field
      label={$_('connection_name')}
      field={connectionName}
      layout="stacked"
    />
    <hr />
    <Field label={$_('database_name')} field={databaseName} layout="stacked" />
    <FieldLayout>
      <div data-identifier="host-port-config">
        <div data-identifier="host-config">
          <Field label={$_('host')} field={host} layout="stacked" />
        </div>
        <div data-identifier="port-config">
          <Field label={$_('port')} field={port} layout="stacked" />
        </div>
      </div>
    </FieldLayout>
    <Field label={$_('username')} field={username} layout="stacked" />
    <div class="help">
      {$_('user_needs_create_connect_privileges')}
      <DocsLink path="/">
        {$_('why_is_this_needed')}
      </DocsLink>
    </div>
    <hr />
    <FieldLayout>
      <div>{$_('change_password')}</div>
      <div class="help">
        {$_('change_password_leave_empty_help')}
      </div>
    </FieldLayout>
    <Field
      label={$_('password')}
      field={password}
      input={{
        component: PasswordInput,
        props: { autocomplete: 'new-password' },
      }}
      layout="stacked"
    />
    <div class="help">
      {$_('password_encryption_help')}
    </div>
  </div>

  <div slot="footer">
    <FormSubmit
      {form}
      onCancel={cancel}
      onProceed={save}
      proceedButton={{ label: $_('update_connection') }}
    />
  </div>
</ControlledModal>

<style lang="scss">
  hr {
    margin: var(--size-large) 0;
  }

  .help {
    font-size: var(--size-small);
    color: var(--slate-400);
    margin: var(--size-super-ultra-small) 0;
  }

  [data-identifier='host-port-config'] {
    display: flex;
    gap: var(--size-base);

    > [data-identifier='host-config'] {
      flex: 1 1 auto;
    }

    > [data-identifier='port-config'] {
      flex: 1 1 5rem;
    }
  }
</style>
