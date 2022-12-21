<script lang="ts">
  import type { Form } from './form';
  import ModificationStatus from '../ModificationStatus.svelte';

  export let form: Form;

  $: ({ requestStatus } = form);
  $: ({ hasChanges } = $form);
</script>

<ModificationStatus {hasChanges} requestState={$requestStatus?.state} />
