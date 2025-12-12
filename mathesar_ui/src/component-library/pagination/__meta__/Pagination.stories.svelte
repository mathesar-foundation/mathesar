<script lang="ts">
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import Pagination from '../Pagination.svelte';
  import PaginationDocs from './Pagination.mdx';

  const meta = {
    title: 'Components/Pagination',
    component: Pagination,
    argTypes: {
      getLink: {
        control: {
          disable: true,
        },
      },
      pageCount: {
        control: {
          disable: true,
        },
      },
    },
    parameters: {
      controls: {
        expanded: true,
      },
      docs: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        page: PaginationDocs,
        source: {
          type: 'code',
        },
      },
    },
  };

  const disabledAddons = {
    controls: {
      disabled: true,
    },
    actions: {
      disabled: true,
    },
  };
</script>

<Meta {...meta} />

<Story
  name="Basic"
  args={{
    currentPage: 1,
    total: 1,
    pageSize: 10,
  }}
  let:args
>
  <Pagination {...args} />
</Story>
<Story name="Multiple Pages" parameters={disabledAddons}>
  <Pagination total={20} />
  <Pagination total={200} />
</Story>
