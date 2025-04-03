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
    background: var(--card-background);
    border: 1px solid var(--card-border);
    border-radius: var(--border-radius-m);
    transition: all 0.2s ease;
  }
  .link-card,
  .link-card.multiple {
    box-shadow: var(--card-hover-shadow);
  }
  .link-card:hover,
  .link-card.multiple:hover .container {
    border-color: var(--card-hover-border);
    box-shadow: var(--card-hover-shadow);
  }
  .container {
    display: flex;
    flex-direction: column;
  }
  .link-card.multiple {
    margin-top: var(--size-base);
  }
  .link-card.multiple .container {
    position: relative;
    bottom: var(--size-xx-small);
    left: var(--size-xx-small);
    background: var(--card-background);
    border: 1px solid var(--card-border);
    border-radius: var(--border-radius-m);
  }
  .table-name {
    color: var(--text-color-primary);
    font-weight: var(--font-weight-medium);
    padding: var(--size-ultra-small) var(--size-xx-small);
    border-bottom: 1px solid var(--card-border);
  }
  .detail {
    color: var(--text-color-tertiary);
    font-size: var(--text-size-small);
    line-height: 1.4;
    padding: var(--size-xx-small) var(--size-xx-small);
  }
</style>
