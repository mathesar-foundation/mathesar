<script lang="ts">
  import { Icon } from '@mathesar-component-library';
  import { iconLoading } from '../common/icons';

  // eslint-disable-next-line no-undef-init
  export let size: string | undefined = undefined;
</script>

<Icon {...iconLoading} spin={true} {size} />
