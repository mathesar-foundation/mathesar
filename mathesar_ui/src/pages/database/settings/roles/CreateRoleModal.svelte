<script lang="ts">
  import { _ } from 'svelte-i18n';

  import {
    Field,
    FieldLayout,
    FormSubmit,
    comboMustBeEqual,
    makeForm,
    requiredField,
  } from '@mathesar/components/form';
  import {
    Checkbox,
    ControlledModal,
    LabeledInput,
    type ModalController,
    PasswordInput,
    portalToWindowFooter,
  } from '@mathesar-component-library';

  export let controller: ModalController;

  const roleName = requiredField('');
  const password = requiredField('');
  const confirmPassword = requiredField('');

  let login = true;

  $: formFields = (() => {
    const fields = {
      roleName,
    };
    return login
      ? {
          ...fields,
          password,
          confirmPassword,
        }
      : fields;
  })();
  $: form = makeForm(formFields, [
    comboMustBeEqual([password, confirmPassword], $_('passwords_do_not_match')),
  ]);
  $: login, password.reset(), confirmPassword.reset();

  function createRole() {
    //
  }
</script>

<ControlledModal {controller} on:close={() => form.reset()}>
  <span slot="title">
    {$_('create_role')}
  </span>
  <div>
    <Field label={$_('role_name')} layout="stacked" field={roleName} />
    <FieldLayout>
      <!-- eslint-disable-next-line @intlify/svelte/no-raw-text -->
      <LabeledInput label="LOGIN" layout="inline-input-first">
        <Checkbox bind:checked={login} />
      </LabeledInput>
    </FieldLayout>
    {#if login}
      <Field
        label={$_('password')}
        layout="stacked"
        field={password}
        input={{
          component: PasswordInput,
          props: { autocomplete: 'new-password' },
        }}
      />
      <Field
        label={$_('confirm_password')}
        layout="stacked"
        field={confirmPassword}
        input={{
          component: PasswordInput,
          props: { autocomplete: 'new-password' },
        }}
      />
    {/if}
  </div>

  <div use:portalToWindowFooter class="footer">
    <FormSubmit
      {form}
      catchErrors
      onCancel={() => {
        form.reset();
        controller.close();
      }}
      onProceed={createRole}
      proceedButton={{ label: $_('create_role') }}
      cancelButton={{ label: $_('cancel') }}
    />
  </div>
</ControlledModal>
