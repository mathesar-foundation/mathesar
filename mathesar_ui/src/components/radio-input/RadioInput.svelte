<script lang="ts">
    export let value = undefined;
    export let group = undefined;
</script>

<label>
    <input type="radio" bind:group value={value}>
    <slot></slot>
</label>
