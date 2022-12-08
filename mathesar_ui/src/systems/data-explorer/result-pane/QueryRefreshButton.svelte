<script lang="ts">
  import RefreshButton from '@mathesar/components/RefreshButton.svelte';
  import type QueryRunner from '../QueryRunner';

  export let queryRunner: QueryRunner;

  $: ({ runState } = queryRunner);

  $: refreshButtonState = (() => {
    let buttonState: 'loading' | 'error' | undefined = undefined;
    const queryRunState = $runState?.state;
    if (queryRunState === 'processing') {
      buttonState = 'loading';
    }
    if (queryRunState === 'failure') {
      buttonState = 'error';
    }
    return buttonState;
  })();
</script>

<RefreshButton state={refreshButtonState} on:click={() => queryRunner.run()} />
