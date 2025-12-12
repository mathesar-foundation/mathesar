<script lang="ts">
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import Docs from './DataTypeBasedInput.mdx';
  import DataTypeBasedInput from '../DataTypeBasedInput.svelte';

  const meta = {
    title: 'Components/DataTypeBasedInput',
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
  <DataTypeBasedInput dataType="boolean" />
  <DataTypeBasedInput dataType="boolean" interfaceType="select" />
</Story>

<Story name="String">
  <DataTypeBasedInput dataType="string" />
  <DataTypeBasedInput dataType="string" interfaceType="textarea" />
  <DataTypeBasedInput dataType="string" enum={['Pichu', 'Pikachu', 'Raichu']} />
</Story>
