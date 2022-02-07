<script lang="ts">
  import { Help } from '@mathesar-component-library';
  import Identifier from '@mathesar/components/Identifier.svelte';
</script>

<Help>
  <p>
    A unique constraint set for <strong>multiple columns</strong> will consider
    records as duplicate only if the values for <em>all</em> columns within the constraint
    are identical.
  </p>
  <p>
    For example, in a <Identifier>People</Identifier> table with
    <Identifier>First name</Identifier> and
    <Identifier>Last name</Identifier> columns, you could add a unique constraint
    on both columns to prevent duplicate people. This constraint would allow people
    to have the same <Identifier>First name</Identifier>
    or the same <Identifier>Last name</Identifier>, but not both.
  </p>
</Help>
