<script lang="ts">
  import { _ } from 'svelte-i18n';

  import {
    type FilledFormValues,
    FormSubmit,
    makeForm,
    requiredField,
  } from '@mathesar/components/form';
  import type { Schema } from '@mathesar/models/Schema';
  import { createTableFromPrompt } from '@mathesar/stores/tables';
  import {
    LabeledInput,
    TextArea,
    portalToWindowFooter,
  } from '@mathesar-component-library';

  export let close: () => void;
  export let schema: Schema;

  const prompt = requiredField('');
  const form = makeForm({ prompt });

  async function save(values: FilledFormValues<typeof form>) {
    await createTableFromPrompt({ schema, prompt: values.prompt });
    close();
  }
</script>

<LabeledInput
  label={$_('describe_your_table')}
  help={$_('describe_table_example')}
  layout="stacked"
>
  <TextArea bind:value={$prompt} rows={5} focusOnMount />
</LabeledInput>

<div use:portalToWindowFooter>
  <FormSubmit
    {form}
    catchErrors
    onProceed={save}
    onCancel={close}
    proceedButton={{ label: $_('create_with_ai') }}
  />
</div>
