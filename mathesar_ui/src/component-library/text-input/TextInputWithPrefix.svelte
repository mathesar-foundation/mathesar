<script lang="ts">
  import Icon from '../icon/Icon.svelte';
  import TextInput from './TextInput.svelte';
  import type { TextInputProps } from './TextInputTypes';

  type $$Props = TextInputProps;

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

{#if prefixIcon}
  <span class="input-element prefix-wrapper">
    <Icon {...prefixIcon} />
    <TextInput
      class={['prefixed-input', 'text-input', classes].join(' ')}
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
{:else}
  <TextInput
    {...$$restProps}
    class={['input-element', 'text-input', classes].join(' ')}
    bind:value
    on:input
    on:focus
    on:blur
    on:keydown
    on:beforeinput
    on:change
  />
{/if}

<style>
  .prefix-wrapper {
    position: relative;
    display: flex;
  }
  :global(.prefix-wrapper .prefixed-input) {
    flex: 1;
    margin-left: 0.2rem;
    border: 0;
  }
</style>
