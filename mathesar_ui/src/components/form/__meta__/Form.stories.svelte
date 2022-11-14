<script>
  import { Meta, Story } from '@storybook/addon-svelte-csf';

  import NumberInput from '@mathesar-component-library-dir/number-input/NumberInput.svelte';
  import { makeForm } from '../form';
  import { requiredField } from '../field';
  import { uniqueWith, min, comboInvalidIf } from '../validators';
  import Field from '../Field.svelte';
  import FormSubmit from '../FormSubmit.svelte';

  const tooYoung = 'You must be at least 16 to register.';
  const noBeer = 'Too young for beer.';
  const nameTakenMsg = 'Name already taken.';

  const name = requiredField('', [uniqueWith(['Jim'], nameTakenMsg)]);
  const age = requiredField(null, [min(16, tooYoung)]);
  const beverage = requiredField('');
  const form = makeForm({ name, age, beverage }, [
    comboInvalidIf([age, beverage], ([a, b]) => b === 'beer' && a < 21, noBeer),
  ]);

  function save() {
    form.reset();
  }
</script>

<Meta title="Systems/Form" />

<Story name="Basic">
  <Field label="Name" field={name} />
  <Field label="Age" field={age} input={NumberInput} />
  <Field label="Beverage" field={beverage} />
  <FormSubmit {form} onCancel={form.reset} onProceed={save} initiallyHidden />
</Story>
