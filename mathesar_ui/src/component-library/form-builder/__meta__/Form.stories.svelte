<script lang="ts">
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import FormStory from './FormStory.svelte';
  import BasicForm from './basicForm';
  import FormWithIfCondition from './formWithIfCondition';
  import FormWithSwitchCondition from './formWithSwitchCondition';
  import Docs from './Form.mdx';

  const meta = {
    title: 'Systems/Form',
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
  <FormStory formConfig={BasicForm}/>
</Story>

<Story name="If Condition">
  <FormStory formConfig={FormWithIfCondition}/>
</Story>

<Story name="Switch Condition">
  <FormStory formConfig={FormWithSwitchCondition}/>
</Story>
