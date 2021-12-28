<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { getLabelControllerFromContainingLabel } from '@mathesar-component-library-dir/label/LabelController';
  import { getGloballyUniqueId } from '@mathesar-component-library-dir/common/utils/domUtils';

  const dispatch = createEventDispatcher();

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
   * When `allowIndeterminate={true}`, the only way to to put the checkdox into
   * an indeterminate state is to pass `checked={null}` -- the user cannot
   * change the value to indeterminate with the pointer.
   */
  export let allowIndeterminate = false;
  export let value: string | number | string[] | undefined = undefined;
  export let disabled = false;
  export let id = getGloballyUniqueId();
  export let labelController = getLabelControllerFromContainingLabel();

  $: indeterminate = allowIndeterminate && checked === null;
  $: labelController?.disabled.set(disabled);
  $: labelController?.inputId.set(id);

  function onChange(e: Event) {
    checked = !checked;
    dispatch('change', {
      checked,
      originalEvent: e,
    });
  }
</script>

<input
  class="checkbox"
  type="checkbox"
  {id}
  {checked}
  {indeterminate}
  {disabled}
  {value}
  on:change={onChange}
/>
