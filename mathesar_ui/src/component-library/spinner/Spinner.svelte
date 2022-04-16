<script lang="ts">
  import { iconSpinner } from '@mathesar-component-library-dir/common/icons';
  import { Icon } from '@mathesar-component-library';

  // eslint-disable-next-line no-undef-init
  export let size: string | undefined = undefined;
</script>

<Icon {...iconSpinner} spin={true} {size} />
