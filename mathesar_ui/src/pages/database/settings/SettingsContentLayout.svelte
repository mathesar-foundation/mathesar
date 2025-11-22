<script lang="ts"></script>

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
    padding: var(--sm2);

    header {
      display: flex;
      align-items: center;
    }
    .title {
      font-size: var(--lg2);
      font-weight: 500;
    }
    .actions {
      margin-left: auto;
    }
    .content {
      padding: var(--lg2) 0;
    }
  }
</style>
