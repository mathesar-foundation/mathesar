<div class="settings-content">
  <header>
    <div class="title">
      <slot name="title" />
    </div>
    <div class="actions">
      <slot name="actions" />
    </div>
  </header>
  <div class="content">
    <slot />
  </div>
</div>

<style lang="scss">
  .settings-content {
    padding: var(--size-x-small);

    header {
      display: flex;
      align-items: center;
    }
    .title {
      font-size: var(--text-size-x-large);
      font-weight: 500;
    }
    .actions {
      margin-left: auto;
    }
    .content {
      padding: var(--size-x-large) 0;
    }
  }
</style>
