<script lang="ts">
  import type { RadioGroupOption } from '@mathesar-component-library/types';

  export let group: string;
  export let idKey = 'id';
  export let labelKey = 'label';
  export let isInline = true;
  export let options: RadioGroupOption[] = [];
</script>

<fieldset class="radio-group">
  <legend>
    <slot></slot>
  </legend>
  <div class:inline={isInline}>
    {#each options as option (option[idKey])}
      <label class="radio">
          <input type="radio" bind:group value={option[idKey]}>
          <span class="label">{option[labelKey]}</span>
      </label>
    {/each}
  </div>
</fieldset>
