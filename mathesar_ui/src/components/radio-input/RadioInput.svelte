<script context="module" lang="ts">
    let id = 0;
    function getId() {
      id += 1;
      return id;
    }
</script>
<script lang="ts">
    export let value = '';
    export let group;

    const radioId = getId();
</script>

<label class="radio" for="radio-{radioId}">
    <input type="radio" id="radio-{radioId}" bind:group {value}>
    <span class="label">{value}</span>
</label>

<style global lang="scss">
  @import "RadioInput.scss"
</style>
