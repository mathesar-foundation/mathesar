<script lang="ts">
  import { faSpinner } from '@fortawesome/free-solid-svg-icons';
  import { Icon } from '@mathesar-component-library';

  export let size: string | undefined = undefined;
</script>

<Icon data={faSpinner} spin={true} {size} />
