<script>
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import Alert from '../Alert.svelte';
</script>

<Meta title="Components/Alert" />

<Story name="Info, concise">
  <Alert>Lorem ipsum dolor sit amet.</Alert>
</Story>

<Story name="Info, verbose">
  <Alert>
    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
    tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
    quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
    consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse
    cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat
    non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
  </Alert>
</Story>

<Story name="Error, concise">
  <Alert appearance="error">Lorem ipsum dolor sit amet.</Alert>
</Story>

<Story name="Error, verbose">
  <Alert appearance="error">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
    tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
    quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
    consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse
    cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat
    non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
  </Alert>
</Story>

<Story name="Warning, concise">
  <Alert appearance="warning">Lorem ipsum dolor sit amet.</Alert>
</Story>

<Story name="Warning, verbose">
  <Alert appearance="warning">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
    tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
    quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
    consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse
    cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat
    non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
  </Alert>
</Story>
