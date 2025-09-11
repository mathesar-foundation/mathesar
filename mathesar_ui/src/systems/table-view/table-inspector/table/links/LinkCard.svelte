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
    background: var(--color-bg-raised-2);
    border: 1px solid var(--color-border-raised-2);
    box-shadow: 0 1px 2px 0 var(--color-shadow);
    border-radius: var(--border-radius-m);
    transition: all 0.2s ease;
  }

  .link-card:hover {
    background: var(--color-bg-raised-2-hover);
    border: 1px solid var(--color-border-raised-2-hover);
  }

  .link-card:focus {
    background: var(--color-bg-raised-2-focused);
    border: 1px solid var(--color-border-raised-2-focused);
    box-shadow: 0 1px 4px 0 var(--color-shadow);
  }

  .link-card:active {
    background: var(--color-bg-raised-2-active);
    border: 1px solid var(--color-border-raised-2-active);
    box-shadow: 0 1px 6px 0 var(--color-shadow);
  }

  .link-card.multiple {
    margin-top: 1rem;
  }

  .link-card.multiple:hover .container {
    background: var(--color-bg-raised-3-hover);
    border: 1px solid var(--color-border-raised-3-hover);
    box-shadow: 0 1px 2px 0 var(--color-shadow);
  }

  .container {
    display: flex;
    flex-direction: column;
  }

  .link-card.multiple .container {
    position: relative;
    bottom: var(--sm3);
    left: var(--sm3);
    background: var(--color-bg-raised-3);
    border: 1px solid var(--color-border-raised-3);
    border-radius: var(--border-radius-m);
  }

  .table-name {
    color: var(--color-fg-base);
    font-weight: var(--font-weight-medium);
    padding: var(--sm4) var(--sm3);
    border-bottom: 0.5px solid var(--color-border-divider);
  }

  .detail {
    color: var(--color-fg-subtle-2);
    font-size: var(--sm1);
    line-height: 1.4;
    padding: var(--sm3) var(--sm3);
  }
</style>
