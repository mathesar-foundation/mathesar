<script lang="ts">
  import { _ } from 'svelte-i18n';

  import InsetPageLayout from '@mathesar/layouts/InsetPageLayout.svelte';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
</script>

<LayoutWithHeader
  fitViewport
  cssVariables={{
    '--max-layout-width': 'var(--max-layout-width-data-pages)',
    '--inset-page-section-padding': 'var(--size-xx-large)',
    '--page-padding': 'var(--outer-page-padding-for-inset-page)',
  }}
>
  <div class="import-preview-content">
    <div class="page-content" class:has-preview={$$slots.preview}>
      <InsetPageLayout>
        <h1 slot="header">{$_('finish_setting_up_table')}</h1>
        <slot />
      </InsetPageLayout>

      <slot name="preview" />
    </div>

    <div class="footer">
      <slot name="footer" />
    </div>
  </div>
</LayoutWithHeader>

<style>
  .import-preview-content {
    display: grid;
    grid-template: 1fr auto / 1fr;
    height: 100%;
    --sheet-header-height: 5.25rem;
  }
  .page-content {
    overflow: auto;
  }
  .page-content:not(.has-preview) {
    background: var(--layout-background-color);
  }
  .footer:not(:empty) {
    border-top: 1px solid var(--border-color);
    padding: 1rem 1rem 1rem 1rem;
    background: var(--footer-background-color);
  }
</style>
