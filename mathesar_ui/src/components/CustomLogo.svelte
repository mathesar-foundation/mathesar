<script lang="ts">
  export let logoUrl: string;
  export let alt = 'Logo';

  let imgError = false;

  // Debug logging
  $: if (logoUrl) {
    console.log('CustomLogo component received logoUrl:', logoUrl);
  }
</script>

{#if !imgError}
  <img
    src={logoUrl}
    {alt}
    class="custom-logo"
    on:error={(e) => {
      imgError = true;
      console.error('Failed to load custom logo from:', logoUrl);
      console.error('Image error event:', e);
      console.error('Image src attribute:', e.currentTarget?.src);
    }}
  />
{/if}

<style>
  .custom-logo {
    width: 1.5rem;
    height: 1.5rem;
    display: block;
    object-fit: contain;
  }
</style>
