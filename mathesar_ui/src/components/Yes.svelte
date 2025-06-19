<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { Icon } from '@mathesar/component-library';
  import { iconYes } from '@mathesar/icons';
</script>

<span class="yes">
  <Icon {...iconYes} label={$_('yes')} />
</span>

<style>
  .yes {
    flex: 0 0 auto;
    display: block;
    font-size: 0.8em;
    background: var(--SYS-accent-asparagus-base);
    color: var(--SYS-text-primary);
    height: 1.8em;
    width: 1.8em;
    padding: 0.3em 0.4em;
    border-radius: 50%;
  }
  .yes :global(svg path) {
    stroke: var(--SYS-accent-asparagus-muted);
    stroke-width: 60;
  }
</style>
