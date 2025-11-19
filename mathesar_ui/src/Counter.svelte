<script>
  let count = 0;
  function increment() {
    count += 1;
  }
</script>

<h1>Count: {count}</h1>
<button on:click={increment}>Increment</button>
