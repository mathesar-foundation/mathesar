<script lang="ts">
  import type { ComponentProps } from 'svelte';

  import { iconHelp } from '@mathesar-component-library-dir/common/icons';
  import Icon from '@mathesar-component-library-dir/icon/Icon.svelte';
  import Tooltip from '@mathesar-component-library-dir/tooltip/Tooltip.svelte';

  type $$Props = ComponentProps<Tooltip>;
</script>

<Tooltip aria-label="Help" class="help-trigger" allowHover {...$$props}>
  <Icon slot="trigger" {...iconHelp} />
  <slot slot="content" />
</Tooltip>
