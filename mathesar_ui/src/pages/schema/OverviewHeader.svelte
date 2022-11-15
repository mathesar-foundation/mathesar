<script lang="ts">
  export let title: string;
</script>

<div class="container">
  <span class="title">{title}</span>
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

    border-bottom: 1px solid var(--slate-200);
  }

  .action-container {
    position: absolute;
    right: 0;
    bottom: 0;
  }

  .title {
    font-size: var(--text-size-large);
    font-weight: bolder;
  }
</style>
