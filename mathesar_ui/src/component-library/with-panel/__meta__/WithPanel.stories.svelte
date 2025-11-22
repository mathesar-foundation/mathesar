<script>
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import WithPanel from '../WithPanel.svelte';
</script>

<Meta title="Components/WithPanel" />

<Story name="Basic">
  <WithPanel>
    <div>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
      tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
      veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
      commodo consequat. Duis aute irure dolor in reprehenderit in voluptate
      velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
      cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id
      est laborum.
    </div>
    <div slot="panel">
      <p>Panel content</p>
    </div>
  </WithPanel>
</Story>
