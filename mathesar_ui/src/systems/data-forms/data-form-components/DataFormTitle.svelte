<script lang="ts">
  import { _ } from 'svelte-i18n';

  export let title: string;
  export let onTitleInput: (title: string) => unknown;
  export let isEditable = false;
  export let isSelected = false;

  function getInputValue(e: Event) {
    const element = e.target as HTMLInputElement;
    return element.value;
  }

  async function onInput(e: Event) {
    onTitleInput(getInputValue(e));
  }
</script>

<div class="form-title-container" class:selected={isSelected}>
  {#if isEditable}
    <input
      class="form-title"
      type="text"
      placeholder={$_('add_form_title')}
      value={title}
      on:input={onInput}
    />
  {:else}
    <h1 class="form-title">
      {title}
    </h1>
  {/if}
</div>

<style lang="scss">
  .form-title {
    border: none;
    padding: var(--sm1);
    font-size: var(--lg3);
    font-weight: var(--font-weight-medium);
    background: transparent;
    width: 100%;
    margin: 0;
    line-height: 1.5;
    letter-spacing: var(--letter-spacing-base);
  }

  input {
    &:not(:focus) {
      cursor: pointer;
    }
  }
</style>
