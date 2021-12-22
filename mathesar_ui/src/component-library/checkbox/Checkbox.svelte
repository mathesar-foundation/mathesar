<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { getLabelControllerFromContainingLabel } from '@mathesar-component-library-dir/label/LabelController';
  import { getGloballyUniqueId } from '@mathesar-component-library-dir/common/utils/domUtils';

  const dispatch = createEventDispatcher();

  /**
   * `null` puts the checkbox in an indeterminate state.
   *
   * We need to use `null` here instead of `undefined` because the prop won't
   * get sent to the component if we pass `undefined`.
   */
  export let checked: boolean | null = false;
  export let value: string | number | string[] | undefined = undefined;
  export let disabled = false;
  export let id = getGloballyUniqueId();
  export let labelController = getLabelControllerFromContainingLabel();

  $: indeterminate = checked === null;
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

<style global lang="scss">
  @import "Checkbox.scss";
</style>
