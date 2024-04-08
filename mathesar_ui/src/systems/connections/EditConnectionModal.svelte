<script lang="ts">
  import { map } from 'iter-tools';
  import { _ } from 'svelte-i18n';

  import {
    ControlledModal,
    LabeledInput,
    PasswordInput,
    type ModalController,
  } from '@mathesar-component-library';
  import type { Connection } from '@mathesar/api/rest/connections';
  import Checkbox from '@mathesar/component-library/checkbox/Checkbox.svelte';
  import TextInput from '@mathesar/component-library/text-input/TextInput.svelte';
  import Identifier from '@mathesar/components/Identifier.svelte';
  import {
    Field,
    FieldLayout,
    FormSubmit,
    isInPortRange,
    makeForm,
    requiredField,
    uniqueWith,
  } from '@mathesar/components/form';
  import InfoBox from '@mathesar/components/message-boxes/InfoBox.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import { connectionsStore } from '@mathesar/stores/databases';
  import { toast } from '@mathesar/stores/toast';
  import { getErrorMessage } from '@mathesar/utils/errors';

  export let controller: ModalController;
  export let connection: Connection;

  $: ({ connections } = connectionsStore);
  $: otherNicknames = new Set(
    map(([, c]) => c.nickname, $connections.without(connection.id)),
  );
  $: connectionName = requiredField(connection.nickname, [
    uniqueWith(otherNicknames),
  ]);
  $: databaseName = requiredField(connection.database);
  $: host = requiredField(connection.host);
  $: port = requiredField(connection.port ?? 5432, [isInPortRange()]);
  $: username = requiredField(connection.username);
  $: changePassword = requiredField(false);
  $: password = requiredField('');
  $: form = makeForm({
    ...{ connectionName, username, changePassword },
    ...($changePassword ? { password } : {}),
  });

  async function save() {
    try {
      await connectionsStore.updateConnection(connection.id, {
        nickname: $connectionName,
        username: $username,
        ...($changePassword ? { password: $password } : {}),
      });
      toast.success($_('connection_updated_successfully'));
      controller.close();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }
</script>

<ControlledModal {controller} on:open={() => form.reset()}>
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
    <Field
      label={$_('database_name')}
      field={databaseName}
      layout="stacked"
      input={{ component: TextInput, props: { disabled: true } }}
    />
    <FieldLayout>
      <div data-identifier="host-port-config">
        <div data-identifier="host-config">
          <Field
            label={$_('host')}
            field={host}
            layout="stacked"
            input={{ component: TextInput, props: { disabled: true } }}
          />
        </div>
        <div data-identifier="port-config">
          <Field
            label={$_('port')}
            field={port}
            layout="stacked"
            input={{ component: TextInput, props: { disabled: true } }}
          />
        </div>
      </div>
    </FieldLayout>

    <FieldLayout>
      <div class="disabled-help">
        <InfoBox>
          <RichText
            text={$_('disabled_connection_edit_fields_help')}
            let:slotName
            let:translatedArg
          >
            {#if slotName === 'issueLink'}
              <a
                href="https://github.com/mathesar-foundation/mathesar/issues/3386"
                target="_blank">{translatedArg}</a
              >
            {/if}
          </RichText>
        </InfoBox>
      </div>
    </FieldLayout>

    <hr />

    <Field
      label={$_('username')}
      field={username}
      layout="stacked"
      help={$_('user_needs_create_connect_privileges')}
    />
    <!-- TODO: Add docs link with $_('why_is_this_needed') text. This link needs
    to be part of the translated string and it needs to point to a specific page
    or section. -->

    <!--
      TODO: Use Field instead of FieldLayout/LabeledInput/Checkbox. We can't do
      this yet because of a compatibility issue between Field and Checkbox.
    -->
    <FieldLayout>
      <LabeledInput label={$_('change_password')} layout="inline-input-first">
        <Checkbox bind:checked={$changePassword} />
      </LabeledInput>
    </FieldLayout>

    {#if $changePassword}
      <Field
        label={$_('new_password')}
        field={password}
        input={{
          component: PasswordInput,
          props: { autocomplete: 'new-password' },
        }}
        layout="stacked"
        help={$_('password_encryption_help')}
      />
    {/if}
  </div>

  <div slot="footer">
    <FormSubmit
      {form}
      canCancel={$form.hasChanges}
      canProceed={$form.hasChanges}
      cancelButton={{ label: $_('reset') }}
      proceedButton={{ label: $_('update_connection') }}
      onCancel={() => form.reset()}
      onProceed={save}
    />
  </div>
</ControlledModal>

<style lang="scss">
  hr {
    margin: var(--size-large) 0;
  }

  .disabled-help {
    font-size: var(--size-small);
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
