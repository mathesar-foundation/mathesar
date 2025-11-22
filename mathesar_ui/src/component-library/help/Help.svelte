<script lang="ts">
  import type { ComponentProps } from 'svelte';

  import { iconHelp } from '@mathesar-component-library-dir/common/icons';
  import Icon from '@mathesar-component-library-dir/icon/Icon.svelte';
  import Tooltip from '@mathesar-component-library-dir/tooltip/Tooltip.svelte';

  type $$Props = ComponentProps<Tooltip>;
</script>

<!--
NOTE: This markup might seem superfluous, but we need both `.help` and
`.help-trigger` because we're using `em` CSS units on `.help` and `rem` CSS
units on `.help-trigger`.
-->
<span class="help">
  <span class="help-trigger">
    <Tooltip aria-label="Help" class="help-trigger" allowHover {...$$props}>
      <Icon slot="trigger" {...iconHelp} />
      <slot slot="content" />
    </Tooltip>
  </span>
</span>

<style>
  .help {
    display: inline-block;
    position: relative;
    /**
     * Move the help bubble up slightly so that it appears somewhat like a
     * superscript. We're using `em` here to ensure that the bubble moves
     * up more when it's placed inside a heading with a larger font size.
     */
    top: -0.3em;
  }
  .help-trigger {
    /**
     * Force a font-size of 1rem so that the help bubbles display with a
     * consistent size, even when they are placed inside headings with
     * larger font sizes.
     */
    font-size: 1rem;
  }
</style>
