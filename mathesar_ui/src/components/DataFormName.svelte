<script lang="ts">
  import type { ComponentProps } from 'svelte';

  import { iconForm } from '@mathesar/icons';
  import type { DataForm } from '@mathesar/models/DataForm';

  import NameWithIcon from './NameWithIcon.svelte';

  interface $$Props extends Omit<ComponentProps<NameWithIcon>, 'icon'> {
    dataForm: DataForm;
    isLoading?: boolean;
  }

  export let dataForm: $$Props['dataForm'];
  export let cssVariables: Record<string, string> | undefined = undefined;

  $: ({ structure } = dataForm);
  $: ({ name } = $structure);
</script>

<NameWithIcon
  icon={iconForm}
  {...$$restProps}
  cssVariables={{
    ...cssVariables,
    '--icon-color': 'var(--color-data-form)',
  }}
  bold
>
  <slot dataFormName={name}>
    {name}
  </slot>
</NameWithIcon>
