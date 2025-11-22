<script>
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import FormBuilderStory from './FormBuilderStory.svelte';
  import BasicForm from './basicForm';
  import FormWithIfCondition from './formWithIfCondition';
  import FormWithSwitchCondition from './formWithSwitchCondition';
  import Docs from './FormBuilder.mdx';

  const meta = {
    title: 'Systems/FormBuilder',
    parameters: {
      docs: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        page: Docs,
        source: {
          type: 'code',
        },
      },
    },
  };
</script>

<Meta {...meta} />

<Story name="Basic">
  <FormBuilderStory formConfig={BasicForm} />
</Story>

<Story name="If Condition">
  <FormBuilderStory formConfig={FormWithIfCondition} />
</Story>

<Story name="Switch Condition">
  <FormBuilderStory formConfig={FormWithSwitchCondition} />
</Story>
