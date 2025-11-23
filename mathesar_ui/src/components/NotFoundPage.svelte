<script lang="ts">
  export let message = 'Not Found';
</script>

<div class="not-found">
  <h2>{message}</h2>
</div>

<style>
  .not-found {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 4rem 1rem;
    text-align: center;
  }

  .not-found h2 {
    margin: 0;
    font-weight: 600;
  }
</style>
