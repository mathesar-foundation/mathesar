<script lang="ts">
  import { Route } from 'tinro';
  import type { CommonData } from '@mathesar/utils/preloadData';

  export let commonData: CommonData;
</script>

<Route path="/shares/*">
  <Route path="/tables/:slug" let:meta>
    {JSON.stringify(meta)}
  </Route>
</Route>
