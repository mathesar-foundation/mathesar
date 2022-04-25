<div class="form">
  <slot />
</div>

<style>
  .form :global(.form-field + .form-field) {
    --form-field-spacing: 1.1em;
    margin-top: var(--form-field-spacing);
    padding-top: var(--form-field-spacing);
    border-top: solid 0.05em #ddd;
  }
</style>
