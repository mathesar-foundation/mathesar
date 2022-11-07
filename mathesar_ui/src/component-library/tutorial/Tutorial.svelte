<script lang="ts">
  let classes = '';
  export { classes as class };
</script>

<div class={['tutorial', classes].join(' ')}>
  <div class="title-and-meta">
    <div class="title"><slot name="title" /></div>
  </div>
  {#if $$slots.body}
    <div class="body"><slot name="body" /></div>
  {/if}
  {#if $$slots.footer}
    <div class="footer"><slot name="footer" /></div>
  {/if}
</div>
