<script lang="ts">
  import { Select } from '@mathesar-component-library';
  import type { UserType } from './utils';

  const userTypes: UserType[] = ['standard', 'admin'];
  export let value: UserType | undefined = undefined;

  function getLabel(v: UserType | undefined) {
    if (v === undefined) {
      return '';
    }
    return v === 'standard' ? 'Standard' : 'Admin';
  }
</script>

<Select {...$$restProps} options={userTypes} bind:value {getLabel} />
