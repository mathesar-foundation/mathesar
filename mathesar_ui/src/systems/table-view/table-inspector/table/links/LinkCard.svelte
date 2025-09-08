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
    background: var(--surface-raised-2-background);
    border: 1px solid var(--surface-raised-2-border-color);
    box-shadow: 0 1px 2px 0 var(--surface-raised-2-muted-background);
    border-radius: var(--border-radius-m);
    transition: all 0.2s ease;
  }

  .link-card:hover {
    background: var(--surface-raised-2-hover-background);
    border: 1px solid var(--surface-raised-2-hover-border-color);
    box-shadow: 0 1px 2px 0 var(--surface-raised-2-muted-background);
  }

  .link-card.multiple {
    margin-top: 1rem;
  }

  .link-card.multiple:hover .container {
    background: var(--surface-raised-3-hover-background);
    border: 1px solid var(--surface-raised-3-hover-border-color);
    box-shadow: 0 1px 2px 0 var(--surface-raised-2-muted-background);
  }

  .container {
    display: flex;
    flex-direction: column;
  }

  .link-card.multiple .container {
    position: relative;
    bottom: var(--sm3);
    left: var(--sm3);
    background: var(--surface-raised-3-background);
    border: 1px solid var(--surface-raised-3-border-color);
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
