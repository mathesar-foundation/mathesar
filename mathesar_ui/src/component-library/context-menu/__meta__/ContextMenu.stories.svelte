<script>
  import {
    faFillDrip,
    faPlus,
    faTimes,
  } from '@fortawesome/free-solid-svg-icons';
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import MenuItem from '@mathesar-component-library-dir/menu/MenuItem.svelte';
  import Checkbox from '@mathesar-component-library-dir/checkbox/Checkbox.svelte';
  import ContextMenu from '../ContextMenu.svelte';

  const meta = {
    title: 'Components/ContextMenu',
  };

  let count = 0;
  let hasBackground = true;

  function incrementCount() {
    count += 1;
  }

  function toggleBackground() {
    hasBackground = !hasBackground;
  }
</script>

<Meta {...meta} />

<Story name="Basic">
  <div class="box without-context">
    <p>This box does <em>not</em> have a context menu.</p>
  </div>

  <div class="box with-context" class:has-background={hasBackground}>
    <p>This box has a context menu.</p>
    <p>The count is: <strong>{count}</strong>.</p>
    <ContextMenu>
      <MenuItem icon={{ data: faFillDrip }} on:click={toggleBackground}>
        <Checkbox slot="control" checked={hasBackground} />
        Use Background
      </MenuItem>
      <MenuItem icon={{ data: faPlus }} on:click={incrementCount}>
        Increment Counter
      </MenuItem>
    </ContextMenu>
  </div>

  <div class="box with-context" has-background>
    <p>This box <em>also</em> has a context menu.</p>
    <ContextMenu>
      <MenuItem icon={{ data: faTimes }}>I don't do anything</MenuItem>
    </ContextMenu>
  </div>

  <div class="box without-context">
    <p>This box does <em>not</em> have a context menu.</p>
  </div>
</Story>

<style>
  .box {
    padding: 0 1em;
    border: solid 0.1em #ccc;
    border-radius: 0.5em;
    margin: 1em 0;
  }
  .with-context.has-background {
    background: rgb(220, 255, 199);
  }

  .without-context {
    background: rgb(255, 220, 199);
  }
</style>
