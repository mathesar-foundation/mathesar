<script lang="ts">
    export let value = undefined;
    export let group = undefined;
</script>

<span class="radio-group">
    <input type="radio" bind:group {value}>
    <label class="radio-label">
        <slot></slot>
    </label>
</span>

<style global lang="scss">
    @import "RadioInput.scss"
</style>