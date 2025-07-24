<script lang="ts">
  import { Route } from 'tinro';

  import SharedFormRoute from './SharedFormRoute.svelte';
</script>

<Route path="/forms/:token/*" let:meta>
  <SharedFormRoute formId={parseInt(meta.params.token, 10)} />
</Route>
