<script lang="ts">
  import type { ComponentProps } from 'svelte';

  import type { IconProps } from '@mathesar/component-library/types';

  import PageTitleAndMeta from './PageTitleAndMeta.svelte';

  interface $$Props extends ComponentProps<PageTitleAndMeta> {
    restrictWidth?: boolean;
  }

  export let icon: IconProps;
  export let name: string;
  export let restrictWidth = true;
</script>

<div class="app-secondary-header">
  <div class="content" class:restrict-width={restrictWidth}>
    <PageTitleAndMeta {icon} {name} {...$$restProps}>
      <slot slot="action" name="action" />
      <slot slot="bottom" name="bottom" />
      <slot slot="subText" name="subText" />
    </PageTitleAndMeta>
  </div>
</div>

<style>
  .app-secondary-header {
    width: 100%;
    padding: 0;
    margin-bottom: var(--lg4);
    background: linear-gradient(
      135deg,
      var(--neutral-200) 0%,
      var(--neutral-300) 50%,
      var(--neutral-400) 100%
    );
  }
  .content {
    padding: var(--lg4) var(--page-padding-x);
    border-radius: var(--border-radius-l);
    max-width: var(--max-layout-width-console-pages);
    margin-left: auto;
    margin-right: auto;
  }
  :global(body.theme-dark) .app-secondary-header {
    background: linear-gradient(
      135deg,
      var(--DARK-MODE-accent-primary-muted) 0%,
      var(--DARK-MODE-surface-base) 50%,
      var(--DARK-MODE-accent-muted) 100%
    );
  }
  .content.restrict-width {
    margin-left: auto;
    margin-right: auto;
  }
</style>
