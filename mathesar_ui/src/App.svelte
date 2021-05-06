<script>
  import { onMount } from 'svelte';
  import { Route, router } from 'tinro';
  import Index from '@mathesar/pages/index/Index.svelte';
  import Tables from '@mathesar/pages/tables/Tables.svelte';

  export let preload = {};

  onMount(() => {
    let unsubscribe = router.subscribe((params) => {
      if (params.from) {
        preload = {};
        unsubscribe();
        unsubscribe = null;
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  });
</script>

<Route path="/tables/:id" let:meta>
  <Tables {...preload} {...meta?.params}/>
</Route>

<Route path="/">
  <Index {...preload}/>
</Route>
