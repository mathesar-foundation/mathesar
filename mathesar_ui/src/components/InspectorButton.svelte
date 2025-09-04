<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { iconInspector } from '@mathesar/icons';
  import { Button, Icon } from '@mathesar-component-library';

  export let active: boolean;
  export let toggle: () => void;
  export let disabled = false;
</script>

<div class="inspector-button">
  <Button
    appearance="custom"
    size="medium"
    on:click={() => toggle()}
    {active}
    {disabled}
    aria-label={$_('inspector')}
  >
    <Icon {...iconInspector} />
    <span class="responsive-button-label">{$_('inspector')}</span>
  </Button>
</div>

<style lang="scss">
  .inspector-button {
    --button-background: var(--color-navigation-15);
    --button-border-color: var(--color-navigation-20);
    --button-color: var(--text-control);
    --button-box-shadow: 0 1px 2px
        color-mix(in srgb, var(--border-shadow), transparent 75%),
      0 1px 3px color-mix(in srgb, var(--border-shadow), transparent 80%),
      0 1px 2px -1px color-mix(in srgb, var(--border-shadow), transparent 80%);

    --button-hover-background: var(--color-navigation-20);
    --button-hover-border-color: var(--color-navigation-40-hover);
    --button-hover-box-shadow: 0 4px 6px -1px color-mix(in srgb, var(--border-shadow), transparent
            10%),
      0 2px 4px -2px color-mix(in srgb, var(--border-shadow), transparent 10%),
      0 0 0 1px color-mix(in srgb, var(--border-shadow), transparent 10%) inset;

    --button-focus-outline: 2px solid;
    --button-focus-outline-color: var(--color-navigation-40-active);

    --button-active-background: var(--color-navigation-40);
    --button-active-border-color: var(--color-navigation-60);
    --button-active-box-shadow: 0 1px 2px
        color-mix(in srgb, var(--border-shadow), transparent 5%),
      0 1px 3px color-mix(in srgb, var(--border-shadow), transparent 10%),
      0 1px 2px -1px color-mix(in srgb, var(--border-shadow), transparent 10%);
  }
</style>
