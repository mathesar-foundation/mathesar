<span class="field">
  <slot />
</span>

<style>
  .field {
    display: block;
    --spacing: 1rem;
    --errors-margin: 0.5rem 0 0 0.5rem;
  }
  :global(.field + .field) {
    margin-top: var(--spacing);
  }
</style>
