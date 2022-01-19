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
  <DynamicInput dataType="boolean" />
  <DynamicInput dataType="boolean" interfaceType="select" />
</Story>

<Story name="String">
  <DynamicInput dataType="string" />
  <DynamicInput dataType="string" interfaceType="textarea" />
  <DynamicInput dataType="string" enum={['Pichu', 'Pikachu', 'Raichu']} />
</Story>
