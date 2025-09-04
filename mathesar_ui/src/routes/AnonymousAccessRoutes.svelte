<script lang="ts">
  import { Route } from 'tinro';

  import SharedFormRoute from './SharedFormRoute.svelte';
</script>

<Route path="/forms/:token/*" let:meta>
  <SharedFormRoute formToken={meta.params.token} />
</Route>
