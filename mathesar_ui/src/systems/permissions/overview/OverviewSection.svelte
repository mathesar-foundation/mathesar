<script lang="ts">
  export let title: string;
</script>

<div class="section">
  <div class="header">
    <span class="title">
      {title}
    </span>
    {#if $$slots.actions}
      <div class="actions">
        <slot name="actions" />
      </div>
    {/if}
  </div>
  <div class="content">
    <slot />
  </div>
</div>

<style lang="scss">
  .section {
    border: 1px solid var(--SYS-border-section);
    border-radius: 4px;
    padding: var(--sm2);

    .header {
      display: flex;
      align-items: center;

      .title {
        font-weight: 600;
      }
      .actions {
        margin-left: auto;
      }
    }

    .content {
      margin-top: 1rem;
    }

    & + :global(.section) {
      margin-top: var(--sm2);
    }
  }
</style>
