<script>
  import {
    faFillDrip,
    faPlus,
    faTimes,
  } from '@fortawesome/free-solid-svg-icons';
  import { Meta, Story } from '@storybook/addon-svelte-csf';
  import ButtonMenuItem from '@mathesar-component-library-dir/menu/ButtonMenuItem.svelte';
  import CheckboxMenuItem from '@mathesar-component-library-dir/menu/CheckboxMenuItem.svelte';
  import ContextMenu from '../ContextMenu.svelte';

  let count = 0;
  let hasBackground = true;

  function incrementCount() {
    count += 1;
  }
</script>

<Meta title="Components/ContextMenu" />

<Story name="Basic">
  <div class="box without-context">
    <p>This box does <em>not</em> have a context menu.</p>
  </div>

  <div class="box with-context" class:has-background={hasBackground}>
    <p>This box has a context menu.</p>
    <p>The count is: <strong>{count}</strong>.</p>
    <ContextMenu>
      <CheckboxMenuItem
        icon={{ data: faFillDrip }}
        bind:checked={hasBackground}
      >
        Use Background
      </CheckboxMenuItem>
      <ButtonMenuItem icon={{ data: faPlus }} on:click={incrementCount}>
        Increment Counter
      </ButtonMenuItem>
    </ContextMenu>
  </div>

  <div class="box with-context" has-background>
    <p>This box <em>also</em> has a context menu.</p>
    <ContextMenu>
      <ButtonMenuItem icon={{ data: faTimes }}
        >I don't do anything</ButtonMenuItem
      >
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
