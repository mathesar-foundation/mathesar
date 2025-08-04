<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { iconSave } from '@mathesar/icons';
  import { SpinnerButton, Tooltip } from '@mathesar-component-library';

  export let canSave: boolean;
  export let onSave: () => Promise<void>;
  export let unsavedChangesText: string = $_('click_to_save');
</script>

<Tooltip enabled={canSave}>
  <div slot="trigger" class="save-button">
    <SpinnerButton
      icon={iconSave}
      label={$_('save')}
      disabled={!canSave}
      onClick={onSave}
      appearance="secondary"
    />
    {#if canSave}
      <div class="dot" />
    {/if}
  </div>
  <span slot="content">{unsavedChangesText}</span>
</Tooltip>

<style>
  .save-button {
    position: relative;
  }
  .dot {
    position: absolute;
    --size: 0.8rem;
    --inset: -0.15rem;
    top: var(--inset);
    right: var(--inset);
    height: var(--size);
    width: var(--size);
    border-radius: 50%;
    background: var(--semantic-danger-bg);
    pointer-events: none;
  }
</style>
