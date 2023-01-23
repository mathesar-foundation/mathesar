<script>
  import Icon from '@mathesar-component-library-dir/icon/Icon.svelte';

  export let side;

  $: price = Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(side.price);
</script>

<span class="side">
  <span class="icon"><Icon {...side.icon} /></span>
  <span class="name">{side.name}</span>
  <span class="price">{price}</span>
</span>

<style>
  .icon {
    color: var(--slate-500);
  }
  .price {
    font-style: italic;
    color: var(--sky-800);
  }
</style>
