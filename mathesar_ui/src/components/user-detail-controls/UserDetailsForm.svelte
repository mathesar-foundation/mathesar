<script lang="ts">
  import { TextInput } from '@mathesar-component-library';
  import {
    optionalField,
    requiredField,
    makeForm,
    Field,
    FormSubmitWithCatch,
  } from '@mathesar/components/form';
  import SelectRole from './SelectRole.svelte';
  import UserFormInput from './UserFormInput.svelte';

  // if undefined: new, or existing
  // export let userDetails;

  const fullname = optionalField('');
  const shortname = optionalField('');
  const username = requiredField('');
  const email = optionalField('');
  const password = requiredField('');
  const role = requiredField<'user' | 'admin' | undefined>('user');

  const form = makeForm({ fullname, username, email, password });
</script>

<div class="user-details-form">
  <UserFormInput label="Full Name">
    <Field field={fullname} input={{ component: TextInput }} />
  </UserFormInput>

  <UserFormInput label="Short Name">
    <Field field={shortname} input={{ component: TextInput }} />
  </UserFormInput>

  <UserFormInput label="Email">
    <Field field={email} input={{ component: TextInput }} />
  </UserFormInput>

  <UserFormInput label="Username *">
    <Field field={username} input={{ component: TextInput }} />
  </UserFormInput>

  <UserFormInput label="Password *">
    <Field field={password} input={{ component: TextInput }} />
  </UserFormInput>

  <UserFormInput label="Role *">
    <Field field={role} input={{ component: SelectRole }} />
  </UserFormInput>
</div>

<FormSubmitWithCatch {form} />

<style lang="scss">
  .user-details-form {
    display: grid;
    grid-template-columns: 1fr 3fr;
    grid-gap: var(--size-large);
    margin-bottom: var(--size-xx-large);
  }
</style>
