<script lang="ts">
  import {
    Icon,
    Spinner,
    iconError,
    iconSuccess,
    iconWarning,
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
    color: var(--gray-400);
    white-space: nowrap;

    .icon > :global(*) {
      display: block;
    }
    > :global(* + *) {
      margin-left: 0.5em;
    }

    &.processing {
      background: var(--info-background-color);
    }
    &.warning {
      background: var(--warning-background-color);
    }
    &.success {
      background: var(--success-background-color);
    }
    &.failure {
      background: var(--danger-background-color);
    }
    &.failure .icon {
      color: var(--danger-color);
    }
  }
</style>
