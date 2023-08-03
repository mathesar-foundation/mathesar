<script lang="ts">
  import InsetPageLayout from '@mathesar/layouts/InsetPageLayout.svelte';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
</script>

<LayoutWithHeader
  fitViewport
  cssVariables={{
    '--max-layout-width': 'var(--max-layout-width-data-pages)',
    '--layout-background-color': 'var(--slate-50)',
    '--inset-page-section-padding': 'var(--size-xx-large)',
    '--page-padding': 'var(--outer-page-padding-for-inset-page)',
  }}
>
  <div class="import-preview-content">
    <div class="page-content">
      <InsetPageLayout>
        <h1 slot="header">Finish setting up your table</h1>
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
  .footer {
    border-top: 1px solid var(--slate-200);
    padding: 1rem 1rem 1rem 1rem;
    background: var(--white);
  }
</style>
