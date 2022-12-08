<script lang="ts">
  import Errors from './Errors.svelte';
  import type { Form } from './form';

  export let form: Form;

  $: ({ requestStatus } = form);
  $: errors = $requestStatus?.state === 'failure' ? $requestStatus.errors : [];
</script>

<Errors {errors} />
