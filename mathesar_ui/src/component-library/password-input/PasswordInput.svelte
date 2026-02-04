<script lang="ts">
  import BaseInput from '@mathesar-component-library-dir/common/base-components/BaseInput.svelte';
  import Icon from '../icon/Icon.svelte';
  import { iconShow, iconHide } from '@mathesar/icons';

  import type { PasswordInputProps } from './PasswordInputTypes';

  type $$Props = PasswordInputProps;

  /**
   * Value of the input. Use bind tag for two-way binding.
   * Refer Svelte docs for more info on binding form input values.
   */
  export let value: $$Props['value'] = '';

  // Additional classes
  let classes = '';
  export { classes as class };

  // Underlying DOM element for direct access
  export let element: $$Props['element'] = undefined;

  export let hasError = false;

  // Id for the input
  export let id: $$Props['id'] = undefined;

  let showPassword = false;
  $: type = showPassword ? 'text' : 'password';
</script>

<BaseInput {...$$restProps} bind:id />

<div class={`password-input-container ${classes}`}>
  <input
    bind:this={element}
    {...$$restProps}
    {type}
    class="input-element password-input"
    class:has-error={hasError}
    bind:value
    {id}
    on:input
    on:focus
    on:blur
    on:keydown
    on:beforeinput
    on:change
  />
  <button
    class="toggle-visibility"
    type="button"
    on:click={() => (showPassword = !showPassword)}
    tabindex="-1"
  >
    <Icon icon={showPassword ? iconHide : iconShow} size="sm" />
  </button>
</div>

<style lang="scss">
  .password-input-container {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;

    .password-input {
      width: 100%;
      padding-right: 2.25rem;
    }

    .toggle-visibility {
      position: absolute;
      right: 0.5rem;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--color-fg-subtle-1);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      height: 100%;
      
      &:hover {
        color: var(--color-fg-base);
      }
    }
  }
</style>
