<script lang="ts">
  import TextInput from '@mathesar-component-library-dir/text-input/TextInput.svelte';

  /**
   * Value of the input. Use bind tag for two-way binding.
   * Refer Svelte docs for more info on binding form input values.
   */
  export let value: string | undefined = undefined;

  // Underlying DOM element for direct access
  export let element: HTMLInputElement | undefined = undefined;

  // Id for the input
  export let id: string | undefined = undefined;

  // Forces input to only allow integer values
  export let isInteger = false;

  const validKeyRegex = /[0-9]|e|\+|-|\./;

  // Before input cannot be relied on, since user can enter chars
  // anywhere in the textbox. This is a temporary method.
  function onBeforeInput(e: Event) {
    // Very basic validation to prevent entering invalid characters
    // Does not cover all cases
    const key = (e as InputEvent).data;
    const inputElement = e.target as HTMLInputElement;

    if (key !== null) {
      if (validKeyRegex.test(key)) {
        if (isInteger && key === '.') {
          e.preventDefault();
        }
        if (inputElement.value !== '' && (key === '-' || key === '+')) {
          e.preventDefault();
        }
      } else {
        e.preventDefault();
      }
    }
  }

  function onInput(e: Event) {
    const inputElement = e.target as HTMLInputElement;
    if (inputElement.value === '') {
      value = undefined;
    } else {
      value = inputElement.value;
    }
  }
</script>

<TextInput
  bind:element
  {...$$restProps}
  {value}
  {id}
  on:beforeinput={onBeforeInput}
  on:input={onInput}
/>
