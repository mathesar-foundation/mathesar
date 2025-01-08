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
    --background: var(--white);
    --shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    --border-left: 3px solid var(--yellow-300);
    --border-radius: 0.375rem;
  }
  .link-card,
  .link-card.multiple .container {
    background-color: var(--background);
    box-shadow: var(--shadow);
    border-left: var(--border-left);
    border-radius: var(--border-radius);
  }
  .link-card:hover {
    --background: var(--slate-50);
    --shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  .container {
    padding: 0.5rem 0.625rem;
  }
  .link-card.multiple {
    margin-top: 1rem;
  }
  .link-card.multiple .container {
    position: relative;
    bottom: 0.5rem;
    left: 0.5rem;
  }
  .detail {
    margin-top: 0.5rem;
    font-size: var(--text-size-small);
    color: var(--color-text-muted);
  }
</style>
