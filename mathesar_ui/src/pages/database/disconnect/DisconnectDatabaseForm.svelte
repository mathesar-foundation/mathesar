<script lang="ts">
  import { some } from 'iter-tools';
  import { _ } from 'svelte-i18n';

  import DocsLink from '@mathesar/components/DocsLink.svelte';
  import {
    FieldLayout,
    FormSubmit,
    makeForm,
    requiredField,
  } from '@mathesar/components/form';
  import { RichText } from '@mathesar/components/rich-text';
  import type { Database } from '@mathesar/models/Database';
  import {
    type DatabaseDisconnectFn,
    databasesStore,
  } from '@mathesar/stores/databases';
  import {
    Checkbox,
    Fieldset,
    Help,
    LabeledInput,
    Tooltip,
    portalToWindowFooter,
  } from '@mathesar-component-library';

  export let database: Database;
  export let disconnect: DatabaseDisconnectFn;
  export let cancel: () => void;

  $: ({ databases } = databasesStore);
  /**
   * True when the current database is the only database associated with its
   * containing server
   */
  $: isLastDbInServer = !some(
    (d) => d.id !== database.id && d.server.id === database.server.id,
    $databases.values(),
  );

  $: removeDbServer = requiredField(isLastDbInServer);

  $: form = makeForm({});

  async function submit() {
    await disconnect({
      database,
      disconnect_db_server: isLastDbInServer && $removeDbServer,
    });
  }
</script>

<div>
  <FieldLayout>
    {$_('database_disconnect_form_into')}
  </FieldLayout>

  <FieldLayout>
    <Fieldset label={$_('in_mathesar')} boxed>
      {#if isLastDbInServer}
        <FieldLayout>
          <LabeledInput layout="inline-input-first">
            <div slot="label">
              {$_('remove_stored_role_passwords')}
              <Help>
                <p>{$_('remove_stored_role_passwords_help_1')}</p>
                <ul>
                  <li>
                    <p>
                      <RichText
                        text={$_('remove_stored_role_passwords_help_checked')}
                        let:slotName
                        let:translatedArg
                      >
                        {#if slotName === 'bold'}
                          <b>{translatedArg}</b>
                        {/if}
                      </RichText>
                    </p>
                  </li>
                  <li>
                    <p>
                      <RichText
                        text={$_('remove_stored_role_passwords_help_unchecked')}
                        let:slotName
                        let:translatedArg
                      >
                        {#if slotName === 'bold'}
                          <b>{translatedArg}</b>
                        {/if}
                      </RichText>
                    </p>
                  </li>
                </ul>
                <p>
                  <RichText
                    text={$_('see_docs_for_stored_role_password_help')}
                    let:slotName
                    let:translatedArg
                  >
                    {#if slotName === 'docsLink'}
                      <DocsLink page="storedRoles">
                        {translatedArg}
                      </DocsLink>
                    {/if}
                  </RichText>
                </p>
              </Help>
            </div>
            <Checkbox bind:checked={$removeDbServer} />
          </LabeledInput>
        </FieldLayout>
      {/if}

      <FieldLayout>
        <Tooltip allowHover placements={['left', 'bottom', 'top']}>
          <svelte:fragment slot="trigger">
            <LabeledInput layout="inline-input-first">
              <div slot="label">{$_('remove_metadata')}</div>
              <Checkbox checked disabled />
            </LabeledInput>
          </svelte:fragment>
          <svelte:fragment slot="content">
            <p>
              <RichText
                text={$_('remove_metadata_field_help')}
                let:slotName
                let:translatedArg
              >
                {#if slotName === 'explorationsLink'}
                  <DocsLink page="metadata">{translatedArg}</DocsLink>
                {/if}
                {#if slotName === 'metadataLink'}
                  <DocsLink page="metadata">{translatedArg}</DocsLink>
                {/if}
              </RichText>
            </p>
            <p>{$_('this_behavior_is_not_configurable')}</p>
          </svelte:fragment>
        </Tooltip>
      </FieldLayout>
    </Fieldset>
  </FieldLayout>
</div>

<div use:portalToWindowFooter>
  <FormSubmit
    {form}
    catchErrors
    onCancel={() => {
      form.reset();
      cancel();
    }}
    onProceed={submit}
    proceedButton={{ label: $_('disconnect') }}
    cancelButton={{ label: $_('cancel') }}
  />
</div>
