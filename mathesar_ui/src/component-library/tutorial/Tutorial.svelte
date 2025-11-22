<script lang="ts">
  let classes = '';
  export { classes as class };
</script>

<div class={['tutorial', classes].join(' ')}>
  <div class="content">
    {#if $$slots.icon}
      <div class="icon">
        <slot name="icon" />
      </div>
    {/if}
    {#if $$slots.title}
      <div class="title">
        <slot name="title" />
      </div>
    {/if}
    {#if $$slots.body}
      <div class="body"><slot name="body" /></div>
    {/if}
    {#if $$slots.footer}
      <div class="footer"><slot name="footer" /></div>
    {/if}
  </div>
</div>
