<script lang="ts">
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import Docs from './DynamicInput.mdx';
  import DynamicInput from '../DynamicInput.svelte';

  const meta = {
    title: 'Components/DynamicInput',
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

<Story name="Boolean">
  <DynamicInput type="boolean"/>
  <DynamicInput type="boolean" inputType="select"/>
</Story>

<Story name="String">
  <DynamicInput type="string"/>
  <DynamicInput type="string" inputType="textarea"/>
  <DynamicInput type="string" enum={['Pichu', 'Pikachu', 'Raichu']}/>
</Story>
