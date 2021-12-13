<script lang="ts">
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import Select from '../Select.svelte';

  const meta = {
    title: 'Components/Select',
    component: Select,
  };
</script>

<Meta {...meta} />

<Story name="Basic">
  <Select
    options={[
      { id: 1, label: 'Option 1' },
      { id: 2, label: 'Option 2' },
      { id: 3, label: 'Option 3' },
      { id: 4, label: 'Option 4' },
    ]}
  />
</Story>

<Story name="Trigger Apperances">
  <Select
    options={[
      { id: 1, label: 'Option 1' },
      { id: 2, label: 'Option 2' },
      { id: 3, label: 'Option 3' },
      { id: 4, label: 'Option 4' },
    ]}
    triggerAppearance="default"
  />

  <Select
    options={[
      { id: 1, label: 'Option 1' },
      { id: 2, label: 'Option 2' },
      { id: 3, label: 'Option 3' },
      { id: 4, label: 'Option 4' },
    ]}
    triggerAppearance="primary"
  />

  <Select
    options={[
      { id: 1, label: 'Option 1' },
      { id: 2, label: 'Option 2' },
      { id: 3, label: 'Option 3' },
      { id: 4, label: 'Option 4' },
    ]}
    triggerAppearance="secondary"
  />

  <Select
    options={[
      { id: 1, label: 'Option 1' },
      { id: 2, label: 'Option 2' },
      { id: 3, label: 'Option 3' },
      { id: 4, label: 'Option 4' },
    ]}
    triggerAppearance="plain"
  />

  <Select
    options={[
      { id: 1, label: 'Option 1' },
      { id: 2, label: 'Option 2' },
      { id: 3, label: 'Option 3' },
      { id: 4, label: 'Option 4' },
    ]}
    triggerAppearance="ghost"
  />
</Story>
