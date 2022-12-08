<div class="inset-page-layout">
  <div class="header restrict-width"><slot name="header" /></div>
  <div class="page restrict-width"><slot /></div>
</div>

<style>
  .inset-page-layout {
    background: var(--sand-200);
    padding: 1.5rem 1rem;
  }
  .restrict-width {
    max-width: var(--max-layout-width, 54rem);
    margin-left: auto;
    margin-right: auto;
    width: 100%;
  }
  .page {
    background: var(--white);
    padding: 1.5rem;
    border: solid 1px var(--slate-300);
    border-radius: 0.3rem;
  }
</style>
