<script lang="ts">
  import type { ComponentProps } from 'svelte';

  import type {
    CssVariablesObj,
    IconProps,
  } from '@mathesar/component-library/types';
  import { makeStyleStringFromCssVariables } from '@mathesar-component-library';

  import PageTitleAndMeta from './PageTitleAndMeta.svelte';

  interface $$Props extends ComponentProps<PageTitleAndMeta> {
    restrictWidth?: boolean;
    cssVariables?: CssVariablesObj;
  }

  export let icon: IconProps | undefined = undefined;
  export let name: string;
  export let restrictWidth = true;
  export let cssVariables: CssVariablesObj | undefined = undefined;

  $: style = cssVariables
    ? makeStyleStringFromCssVariables(cssVariables)
    : undefined;
</script>

<div class="app-secondary-header" {style}>
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
    margin-bottom: var(--AppSecondaryHeader__margin-bottom, var(--lg4));
    background: var(
      --AppSecondaryHeader__background,
      var(--surface-supporting)
    );
  }
  .content {
    padding: var(--lg4) var(--page-padding-x);
    border-radius: var(--border-radius-l);
    max-width: var(--max-layout-width-console-pages);
    margin-left: auto;
    margin-right: auto;
  }
  .content.restrict-width {
    margin-left: auto;
    margin-right: auto;
  }
</style>
