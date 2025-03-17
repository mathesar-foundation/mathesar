<script lang="ts">
  import { _ } from 'svelte-i18n';
</script>

<div class="new-pk-column-type-option">
  <div class="type">
    <span class="value"><slot name="type" /></span>
  </div>

  <div class="default-value">
    <span class="label">{$_('default_value')}:</span>
    <span class="value"><slot name="defaultValue" /></span>
  </div>
</div>

<style>
  .new-pk-column-type-option {
    display: grid;
    gap: 0.5rem;
  }
  .label {
    color: var(--color-text-muted);
  }
  .default-value {
    font-size: var(--text-size-small);
  }
</style>
