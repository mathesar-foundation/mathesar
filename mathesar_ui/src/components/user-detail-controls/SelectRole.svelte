<script lang="ts">
  import { Select } from '@mathesar/component-library';

  type Role = 'user' | 'admin';

  const roles: Role[] = ['user', 'admin'];
  export let value: Role | undefined = undefined;

  function getLabel(v: Role | undefined) {
    if (v === undefined) {
      return '';
    }
    return v === 'user' ? 'User' : 'Admin';
  }
</script>

<Select options={roles} bind:value {getLabel} />
