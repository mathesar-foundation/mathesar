<script lang="ts">
  export let displayAsMultiple = false;
  export let href: string;
</script>

<a class="passthrough link-card" {href} class:multiple={displayAsMultiple}>
  <div class="container">
    <div class="table-name">
      <slot name="table-name" />
    </div>
    <div class="detail">
      <slot name="detail" />
    </div>
  </div>
</a>

<style>
  .link-card {
    display: block;
    cursor: pointer;
    background: var(--surface-elevated-mid);
    border: 1px solid var(--border-card);
    border-radius: var(--border-radius-m);
    box-shadow: 0 1px 2px 0 var(--surface-elevated-mid-muted);
    transition: all 0.2s ease;
  }

  .link-card:hover {
    border: 1px solid var(--border-card-hover);
    box-shadow: 0 1px 2px 0 var(--surface-elevated-mid-muted);
    background: var(--surface-elevated-mid-hover);
  }

  .link-card.multiple {
    margin-top: 1rem;
  }

  .link-card.multiple:hover .container {
    border: 1px solid var(--border-card-hover);
    box-shadow: 0 1px 2px 0 var(--surface-elevated-mid-muted);
    background: var(--surface-elevated-high-hover);
  }

  .container {
    display: flex;
    flex-direction: column;
  }

  .link-card.multiple .container {
    position: relative;
    bottom: var(--sm3);
    left: var(--sm3);
    background: var(--surface-elevated-high);
    border: 1px solid var(--border-card);
    border-radius: var(--border-radius-m);
  }

  .table-name {
    color: var(--text-primary);
    font-weight: var(--font-weight-medium);
    padding: var(--sm4) var(--sm3);
    border-bottom: 0.5px solid var(--border-divider);
  }

  .detail {
    color: var(--text-tertiary);
    font-size: var(--sm1);
    line-height: 1.4;
    padding: var(--sm3) var(--sm3);
  }
</style>
