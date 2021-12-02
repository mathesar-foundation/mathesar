<script lang="ts">
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import FormStory from './FormStory.svelte';
  import TextConfigForm from './textConfigForm';
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
  <FormStory formConfig={TextConfigForm}/>
</Story>
