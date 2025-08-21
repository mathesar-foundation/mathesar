<script lang="ts">
  import BaseInput from '@mathesar-component-library-dir/common/base-components/BaseInput.svelte';
  import type { LabelController } from '@mathesar-component-library-dir/label';

  import type { PasswordInputProps } from './PasswordInputTypes';

  type $$Props = PasswordInputProps;

  export let value: $$Props['value'] = '';

  let classes: string | null = '';
  export { classes as class };

  export let element: $$Props['element'] = undefined;

  export let hasError = false;

  export let id: $$Props['id'] = undefined;

  export let disabled = false;

  export let labelController: LabelController | undefined = undefined;

  export let focusOnMount: boolean | undefined = undefined;
</script>

<BaseInput bind:id {labelController} {disabled} {focusOnMount} />

<input
  bind:this={element}
  {...$$restProps}
  type="password"
  class="input-element password-input {classes ?? ''}"
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
