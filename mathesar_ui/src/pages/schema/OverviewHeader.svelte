<script lang="ts">
  export let title: string;
</script>

<div class="container">
  <h2>{title}</h2>
  {#if $$slots.action}
    <div class="action-container">
      <slot name="action" />
    </div>
  {/if}
</div>

<style lang="scss">
  .container {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 0.25rem;
    position: relative;
  }
  h2 {
    margin: 0;
  }
</style>
