<script lang="ts">
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import Skeleton from '../Skeleton.svelte';
  import SkeletonDocs from './Skeleton.mdx';

  const meta = {
    title: 'Components/Skeleton',
    component: Skeleton,
    parameters: {
      controls: {
        hideNoControlsWarning: true,
        expanded: true,
      },
      actions: {
        disabled: true,
      },
      docs: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        page: SkeletonDocs,
        source: {
          type: 'code',
        },
      },
    },
  };
</script>

<Meta {...meta} />

<Story
  name="Basic"
  args={{
    loading: true,
  }}
  let:args
>
  <div style="position:relative;height:30px;width:100px;">
    <Skeleton {...args} />
  </div>
</Story>
