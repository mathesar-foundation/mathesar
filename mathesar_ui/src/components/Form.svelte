<div class="form">
  <slot />
</div>

<style lang="scss">
  .form {
    --form-field-spacing: 1.1em;

    :global(.form-field + .form-field) {
      padding-top: var(--form-field-spacing);
    }
  }
</style>
