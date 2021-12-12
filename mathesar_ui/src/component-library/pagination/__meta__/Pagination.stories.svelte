<script lang="ts">
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import Pagination from '../Pagination.svelte';
  import PaginationDocs from './Pagination.mdx'
  const meta = {
    title: 'Components/Pagination',
    component: Pagination,
    parameters: {
      controls: {
        //hide
        expanded: true
      },
      docs: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        page: PaginationDocs,
        source: {
          type: 'code',
        },
      },
    }
  };
</script>

<Meta {...meta} />

<Story name="Basic">
  <Pagination page={1} total={1}/>
</Story>
<Story name="Second">
  <Pagination page={1} total={2} pageSize={1}/>
</Story>
<Story name="Third">
  <Pagination page={1} total={1000}/>
</Story>
