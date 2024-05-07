<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { Select } from '@mathesar-component-library';

  import type { UserType } from './utils';

  const userTypes: UserType[] = ['standard', 'admin'];
  export let value: UserType | undefined = undefined;

  function getLabel(v: UserType | undefined) {
    if (v === undefined) {
      return '';
    }
    return v === 'standard' ? $_('standard') : $_('admin');
  }
</script>

<Select {...$$restProps} options={userTypes} bind:value {getLabel} />
