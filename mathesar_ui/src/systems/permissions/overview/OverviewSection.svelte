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
    .header {
      border-bottom: 1px solid var(--gray-200);
      padding: var(--sm6) 0;
      display: flex;
      align-items: center;

      .title {
        font-weight: 600;
      }
      .actions {
        --input-padding: var(--sm6);
        margin-left: auto;
      }
    }

    .content {
      margin-top: 1rem;
    }

    & + :global(.section) {
      margin-top: var(--lg2);
    }
  }
</style>
