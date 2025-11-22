<script>
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import ToastStoryHighLevel from './ToastStoryHighLevel.svelte';
  import ToastStoryLowLevel from './ToastStoryLowLevel.svelte';
  import ToastStoryCustomItem from './ToastStoryCustomItem.svelte';

  const meta = {
    title: 'Systems/Toast',
  };
</script>

<Meta {...meta} />

<Story name="High level">
  <ToastStoryHighLevel />
</Story>

<Story name="Low level">
  <ToastStoryLowLevel />
</Story>

<Story name="Custom toast item component">
  <ToastStoryCustomItem />
</Story>
