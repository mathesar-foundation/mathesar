<script lang="ts">
  import { Icon } from '@mathesar-component-library';
  import { iconLoading } from '@mathesar-component-library-dir/common/icons';

  // eslint-disable-next-line no-undef-init
  export let size: string | undefined = undefined;
</script>

<Icon {...iconLoading} {size} />
