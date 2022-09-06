<script lang="ts">
  import { Help } from '@mathesar-component-library';
  import Null from '@mathesar/components/Null.svelte';
</script>

<Help>
  <p>Unique constraints reject duplicate records before they get entered.</p>
  <p>Special behavior:</p>
  <ul>
    <li>
      <Null /> values are always considered unique.
    </li>
  </ul>
</Help>
