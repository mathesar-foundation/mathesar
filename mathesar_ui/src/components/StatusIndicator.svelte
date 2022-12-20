<script lang="ts">
  import {
    Icon,
    iconError,
    iconSuccess,
    iconWarning,
    Spinner,
  } from '@mathesar-component-library';

  type State = 'processing' | 'success' | 'failure' | 'warning';

  export let state: State;
  export let messages: Partial<Record<State, string>>;

  let classes = '';
  export { classes as class };
</script>

<span class="status-indicator {state} {classes}">
  <span class="icon">
    {#if state === 'processing'}
      <Spinner />
    {:else if state === 'success'}
      <Icon {...iconSuccess} />
    {:else if state === 'failure'}
      <Icon {...iconError} />
    {:else}
      <Icon {...iconWarning} />
    {/if}
  </span>
  <span>
    {messages[state] ?? ''}
  </span>
</span>

<style lang="scss">
  .status-indicator {
    border-radius: 500px;
    padding: 0.5em 0.75rem;
    font-size: var(--text-size-small);
    display: inline-flex;
    align-items: center;
    color: var(--slate-400);
    white-space: nowrap;

    .icon > :global(*) {
      display: block;
    }
    > :global(* + *) {
      margin-left: 0.5em;
    }

    &.processing {
      background: var(--sky-200);
    }
    &.warning {
      background: var(--yellow-100);
    }
    &.success {
      background: var(--green-100);
    }
    &.failure {
      background: var(--red-100);
    }
    &.failure .icon {
      color: var(--red-500);
    }
  }
</style>
