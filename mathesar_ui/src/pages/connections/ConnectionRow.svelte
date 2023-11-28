<script lang="ts">
  import type { Database } from '@mathesar/AppTypes';
  import { Icon } from '@mathesar/component-library';
  import { iconEdit } from '@mathesar/icons';

  export let connection: Database;
</script>

<div data-identifier="connection-row" class="grid-row">
  <span>{connection.nickname}</span>
  <span>{connection.database}</span>
  <span>{connection.username}</span>
  <span>{connection.host}</span>
  <span>{connection.port}</span>
  <div>
    <Icon {...iconEdit} />
  </div>
</div>

<style lang="scss">
  [data-identifier='connection-row'] {
    display: contents;

    > * {
      padding: var(--size-large);
    }
  }
</style>
