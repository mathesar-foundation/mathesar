<script lang="ts">
    export let group: string;
    export let idKey = 'id';
    export let labelKey = 'label';
    export let isInline = true;
    export let options = [];
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

<style global lang="scss">
  @import "RadioGroup.scss"
</style>
