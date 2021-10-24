<script lang="ts">
    export let group: string;
    export let options = [];
    export let isInLine = true;
</script>

<fieldset class="fieldset">
  <legend>
    <slot></slot>
  </legend>
  <div class:inline={isInLine}>
    {#each options as value}
      <label class="radio">
          <input type="radio" bind:group {value}>
          <span class="label">{value}</span>
      </label>
    {/each}
  </div>
</fieldset>

<style global lang="scss">
  @import "RadioGroup.scss"
</style>
