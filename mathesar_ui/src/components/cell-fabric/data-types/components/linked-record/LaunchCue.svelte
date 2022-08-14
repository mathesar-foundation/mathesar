<script lang="ts">
  import { faSearchPlus } from '@fortawesome/free-solid-svg-icons';
  import { Button, Icon } from '@mathesar/component-library';

  let isHovering = false;
</script>

<span class="launch-cue" class:is-hovering={isHovering}>
  <Button
    on:mouseenter={() => {
      isHovering = true;
    }}
    on:mouseleave={() => {
      isHovering = false;
    }}
    appearance="ghost"
    title="Select Record"
    class="padding-zero launch-cue-button"
    on:click
    tabindex="-1"
  >
    <span class="icon-wrapper">
      <Icon data={faSearchPlus} />
    </span>
  </Button>
  <span class="hover-indicator" />
</span>

<style>
  .launch-cue {
    display: block;
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    border-radius: 0.2em;
    background: white;
  }
  .hover-indicator {
    display: block;
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    background-color: var(--color-fk);
    opacity: 0.4;
    z-index: 1;
  }
  .launch-cue:not(.is-hovering) .hover-indicator {
    display: none;
  }
  :global(.launch-cue-button) {
    z-index: 2;
    height: 100%;
  }
  .icon-wrapper {
    padding: 0 0.6em;
  }
</style>
