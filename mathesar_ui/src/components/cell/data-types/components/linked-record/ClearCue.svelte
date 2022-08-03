<script lang="ts">
  import { faBackspace } from '@fortawesome/free-solid-svg-icons';
  import { Button, Icon } from '@mathesar/component-library';

  let isHovering = false;
</script>

<span class="clear-cue" class:is-hovering={isHovering}>
  <Button
    on:mouseenter={() => {
      isHovering = true;
    }}
    on:mouseleave={() => {
      isHovering = false;
    }}
    appearance="ghost"
    title="Clear Value"
    class="padding-zero clear-cue-button"
    on:click
  >
    <span class="icon-wrapper">
      <Icon data={faBackspace} />
    </span>
  </Button>
  <span class="hover-indicator" />
</span>

<!--
  Requirements around z-index values:

  - In LinkedRecordInput, the LinkedRecord needs to be above the ClearCue to
    start so that the user can click on the navigation link to open the linked
    record.

  - When the ClearCue button is hovered, the .hover-indicator element needs to
    be stacked above the LinkedRecord so that the LinkedRecord is dimmed. Also
    the .clear-cue-button needs to be stacked above the .hover-indicator so that
    it's still clickable.
-->
<style>
  .clear-cue {
    display: block;
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    border-radius: 0.2em;
    text-align: right;
    z-index: 1;
  }
  .clear-cue.is-hovering {
    z-index: 3;
  }
  .hover-indicator {
    display: block;
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    background-color: white;
    opacity: 0.5;
    z-index: 1;
    pointer-events: none;
  }
  .clear-cue:not(.is-hovering) .hover-indicator {
    display: none;
  }
  :global(.clear-cue-button) {
    z-index: 4;
    height: 100%;
  }
  .icon-wrapper {
    padding: 0 0.6em;
    color: #555;
  }
  .clear-cue.is-hovering .icon-wrapper {
    color: black;
  }
</style>
