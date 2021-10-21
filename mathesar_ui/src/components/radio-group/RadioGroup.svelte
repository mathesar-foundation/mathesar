<script lang="ts">
    export let group;
    export let options = [];
</script>

<fieldset>
  <legend>
    <slot></slot>
  </legend>
  {#each options as option}
    <label class="radio">
        <input type="radio" bind:group value={option}>
        <span class="label">{option}</span>
    </label>
  {/each}
</fieldset>

<style global lang="scss">
  @import "RadioGroup.scss"
</style>
