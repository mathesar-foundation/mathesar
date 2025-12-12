<script>
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import Window from '../Window.svelte';
</script>

<Meta title="Components/Window" />

<Story name="basic">
  <Window>
    <div slot="title">My <em>title</em></div>
    Content
    <div slot="footer">My <em>footer</em></div>
  </Window>
</Story>
