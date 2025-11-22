<script lang="ts">
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import Checkbox from '../Checkbox.svelte';

  const meta = {
    title: 'Components/Checkbox',
  };
</script>

<Meta {...meta} />

<Story name="Basic">
  <p>Within <Checkbox /> some text.</p>
  <table>
    <tr><th /><th>checked</th><th>disabled</th></tr>
    <tr><td><Checkbox /></td><td>false</td><td>false</td></tr>
    <tr><td><Checkbox checked /></td><td>true</td><td>false</td></tr>
    <tr
      ><td><Checkbox allowIndeterminate checked={null} /></td><td>null</td><td
        >false</td
      ></tr
    >
    <tr><td><Checkbox disabled /></td><td>false</td><td>true</td></tr>
    <tr><td><Checkbox disabled checked /></td><td>true</td><td>true</td></tr>
    <tr
      ><td><Checkbox allowIndeterminate disabled checked={null} /></td><td
        >null</td
      ><td>true</td></tr
    >
  </table>
</Story>

<style>
  td,
  th {
    text-align: center;
  }
</style>
