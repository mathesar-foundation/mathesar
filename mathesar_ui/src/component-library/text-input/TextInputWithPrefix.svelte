<script lang="ts">
  import Icon from '../icon/Icon.svelte';
  import TextInput from './TextInput.svelte';
  import type { TextInputWithPrefixProps } from './TextInputTypes';

  type $$Props = TextInputWithPrefixProps;

  /**
   * Value of the input. Use bind tag for two-way binding.
   * Refer Svelte docs for more info on binding form input values.
   */
  export let value: $$Props['value'] = '';

  // Additional classes
  let classes = '';
  export { classes as class };

  export let prefixIcon: $$Props['prefixIcon'];
</script>

<span class="prefix-wrapper">
  <div class="input-prefix-icon-container">
    <Icon {...prefixIcon} />
  </div>
  <TextInput
    class={['prefixed-input', classes].join(' ')}
    {...$$restProps}
    bind:value
    on:input
    on:focus
    on:blur
    on:keydown
    on:beforeinput
    on:change
  />
</span>

<style lang="scss">
  .prefix-wrapper {
    --icon-width: 2.142rem;
    position: relative;
    display: block;

    .input-prefix-icon-container {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      width: var(--icon-width);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    :global(.prefixed-input) {
      padding-left: var(--icon-width);
    }
  }
</style>
