<script lang="ts">
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import Label from '../Label.svelte';

  const meta = {
    title: 'Components/Label',
  };

</script>

<Meta {...meta} />

<Story name="Basic">
  <Label let:inputId>
    <input type="checkbox" id={inputId} />
    <span>Foo</span>
  </Label>
</Story>
