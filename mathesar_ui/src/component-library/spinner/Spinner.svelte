<script lang="ts">
  import { iconLoading } from '@mathesar-component-library-dir/common/icons';
  import Icon from '@mathesar-component-library-dir/icon/Icon.svelte';

  // eslint-disable-next-line no-undef-init
  export let size: string | undefined = undefined;
</script>

<Icon {...iconLoading} {size} />
