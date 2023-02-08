<div class="inset-page-section">
  {#if $$slots.header}
    <div class="header"><slot name="header" /></div>
  {/if}
  <div class="section"><slot /></div>
</div>

<style>
  .section {
    background: var(--white);
    padding: var(--inset-page-section-padding, 1.5rem 1rem);
    border: solid 1px var(--slate-300);
    border-radius: 0.3rem;
  }
</style>
