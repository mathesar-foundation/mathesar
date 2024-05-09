<script lang="ts">
  import { iconHelp } from '@mathesar-component-library-dir/common/icons';
  import Icon from '@mathesar-component-library-dir/icon/Icon.svelte';
  import Tooltip from '@mathesar-component-library-dir/tooltip/Tooltip.svelte';
</script>

<Tooltip aria-label="Help" class="help-trigger" allowHover>
  <Icon slot="trigger" {...iconHelp} />
  <slot slot="content" />
</Tooltip>
