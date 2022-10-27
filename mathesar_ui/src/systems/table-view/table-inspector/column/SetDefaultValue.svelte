<script lang="ts">
  import EditableTextWithActions from '@mathesar/components/EditableTextWithActions.svelte';

  // TODO:
  function getValidationErrors(): string[] {
    return [];
  }

  // TODO:
  function handleDefaultValueSet() {
    return Promise.resolve();
  }
</script>

<div class="set-default-value-container">
  <span class="label">Value</span>
  <EditableTextWithActions
    onSubmit={handleDefaultValueSet}
    {getValidationErrors}
  />
</div>

<style lang="scss">
  .set-default-value-container {
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 0.5rem;
    }
  }
</style>
