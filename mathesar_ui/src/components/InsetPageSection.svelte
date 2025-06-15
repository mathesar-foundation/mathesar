<script lang="ts"></script>

<div class="inset-page-section">
  <slot name="header" />
  <div class="section"><slot /></div>
</div>

<style>
  .section {
    background: var(--inset-background-color);
    padding: var(--inset-page-section-padding, 2rem 1.5rem);
    border: solid 1px var(--SYS-border-section);
    border-radius: 0.3rem;
  }
</style>
