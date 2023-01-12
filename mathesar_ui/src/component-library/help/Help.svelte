<script lang="ts">
  import Tooltip from '@mathesar-component-library-dir/tooltip/Tooltip.svelte';
  import Icon from '@mathesar-component-library-dir/icon/Icon.svelte';
  import { iconHelp } from '@mathesar-component-library-dir/common/icons';
</script>

<Tooltip aria-label="Help" class="help-trigger">
  <Icon slot="trigger" {...iconHelp} />
  <slot slot="content" />
</Tooltip>
