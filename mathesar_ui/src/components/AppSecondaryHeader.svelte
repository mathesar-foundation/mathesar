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
    background-color: var(--sand-200);
  }
  .content {
    padding: var(
      --AppSecondaryHeader__padding,
      var(--size-large) var(--page-padding-x)
    );
  }
  .content.restrict-width {
    max-width: var(--max-layout-width);
    margin-left: auto;
    margin-right: auto;
  }
</style>
