<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import BaseInput from '@mathesar-component-library-dir/common/base-components/BaseInput.svelte';

  const dispatch = createEventDispatcher<{ change: boolean }>();

  /**
   * When `allowIndeterminate={true}`, then setting `checked={null}` will put
   * the checkbox in an indeterminate state.
   *
   * We need to use `null` here instead of `undefined` because the prop won't
   * get sent to the component if we pass `undefined`.
   */
  export let checked: boolean | null = false;
  /**
   * By default, all falsy values (including `null`) will set the checkbox to
   * unchecked. If you set `allowIndeterminate = true`, then the `checked` prop
   * will treat `null` as indeterminate.
   *
   * When `allowIndeterminate={true}`, the only way to to put the checkbox into
   * an indeterminate state is to pass `checked={null}` -- the user cannot
   * change the value to indeterminate with the pointer.
   */
  export let allowIndeterminate = false;
  export let value: string | number | string[] | undefined = undefined;
  export let disabled = false;
  export let id: string | undefined = undefined;

  $: indeterminate = allowIndeterminate && checked === null;

  function onChange() {
    checked = !checked;
    dispatch('change', checked);
  }
</script>

<BaseInput {...$$restProps} bind:id {disabled} />

<input
  {...$$restProps}
  class="checkbox"
  type="checkbox"
  {id}
  checked={checked ?? undefined}
  {indeterminate}
  {disabled}
  {value}
  on:change={onChange}
  on:click
  on:mousedown
/>
